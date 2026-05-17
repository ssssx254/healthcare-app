import { getApiBaseUrl } from "@/config/api";
import { getAuthToken, getAuthTokenFromStorage } from "@/lib/api/authToken";
import { readGetCache, saveGetCache } from "@/lib/api/responseCache";
import { getNetworkSnapshot, markServedFromCache } from "@/lib/network/networkRuntime";
import type { ApiPaginatedData } from "@/types/api/envelope";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ApiSuccessBody<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

const REQUEST_TIMEOUT_MS = 12000;
const SAFE_GET_RETRY_COUNT = 2;
const SAFE_GET_RETRY_DELAY_MS = 500;
const NETWORK_ERROR_MESSAGE = "Сервертэй холбогдож чадсангүй. Интернет холболтоо шалгана уу. Дахин оролдоно уу.";
const OFFLINE_ACTION_BLOCKED_MESSAGE = "Интернет холболтоо шалгана уу. Дахин оролдоно уу.";

function joinUrl(base: string, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${p}`;
}

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  /** JSON body — автоматаар stringify хийнэ */
  json?: unknown;
  body?: RequestInit["body"];
  timeoutMs?: number;
  retryGetCount?: number;
};

function buildCacheKey(path: string, method: string): string {
  return `${method}:${path}`;
}

function isImageUploadPayload(json: unknown): boolean {
  if (!json || typeof json !== "object") return false;
  const body = json as Record<string, unknown>;
  const logo = typeof body.logo_url === "string" ? body.logo_url : "";
  const profileImage = typeof body.profile_image === "string" ? body.profile_image : "";
  return logo.startsWith("data:image/") || profileImage.startsWith("data:image/");
}

function shouldBlockWhenOffline(method: string, path: string, json: unknown): boolean {
  if (method === "GET") return false;
  if (path === "/bookings" && method === "POST") return true; // booking creation
  if (path.includes("/payment") || path.startsWith("/wallet") || path.includes("pay-booking")) return true; // payments
  if (/^\/chat\/conversations\/[^/]+\/messages$/.test(path) && method === "POST") return true; // chat send
  if (isImageUploadPayload(json)) return true; // image upload
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

function isNetworkFailure(err: unknown): boolean {
  return (
    err instanceof TypeError ||
    (err instanceof Error && /network|failed to fetch|load failed|network request failed/i.test(err.message))
  );
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (err) {
    if (isAbortError(err)) {
      throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
    }
    if (isNetworkFailure(err)) {
      throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseErrorMessage(parsed: unknown): string {
  if (parsed && typeof parsed === "object" && "message" in parsed && typeof (parsed as { message?: unknown }).message === "string") {
    return (parsed as { message: string }).message;
  }
  return "Дахин оролдоно уу.";
}

function unwrapEnvelope<T>(parsed: unknown, status: number): T {
  if (parsed && typeof parsed === "object" && "success" in parsed) {
    const envelope = parsed as ApiSuccessBody<T>;
    if (envelope.success === false) {
      throw new ApiError(envelope.message || "Дахин оролдоно уу.", status);
    }
    return envelope.data as T;
  }
  // Зарим endpoint envelope-гүй буцаах тохиолдолд backward-compatible байлгана.
  return parsed as T;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const base = getApiBaseUrl();
  const url = joinUrl(base, path);
  const {
    json,
    body: rawBody,
    timeoutMs = REQUEST_TIMEOUT_MS,
    retryGetCount = SAFE_GET_RETRY_COUNT,
    method = "GET",
    ...rest
  } = options;
  const normalizedMethod = method.toUpperCase();
  const headers = new Headers(rest.headers);
  if (json !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAuthToken() ?? (await getAuthTokenFromStorage());
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const body = json !== undefined ? JSON.stringify(json) : rawBody;
  let lastError: unknown = null;
  const attempts = normalizedMethod === "GET" ? retryGetCount + 1 : 1;
  const cacheKey = buildCacheKey(path, normalizedMethod);
  const { isOnline } = getNetworkSnapshot();

  if (!isOnline && shouldBlockWhenOffline(normalizedMethod, path, json)) {
    throw new ApiError(OFFLINE_ACTION_BLOCKED_MESSAGE, 0);
  }

  if (!isOnline && normalizedMethod === "GET") {
    const cached = await readGetCache<T>(cacheKey);
    if (cached) {
      markServedFromCache();
      return cached.data;
    }
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
  }

  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetchWithTimeout(
        url,
        {
          ...rest,
          method: normalizedMethod,
          headers,
          body,
        },
        timeoutMs,
      );

      const text = await res.text();
      let parsed: unknown = null;
      if (text) {
        try {
          parsed = JSON.parse(text) as unknown;
        } catch {
          throw new ApiError("Серверийн хариу буруу форматтай байна. Дахин оролдоно уу.", res.status);
        }
      }

      if (!res.ok) {
        throw new ApiError(parseErrorMessage(parsed), res.status);
      }

      const output = unwrapEnvelope<T>(parsed, res.status);
      if (normalizedMethod === "GET") {
        await saveGetCache(cacheKey, output);
      }
      return output;
    } catch (error) {
      lastError = error;
      const canRetry = normalizedMethod === "GET" && i < attempts - 1;
      const shouldRetry =
        error instanceof ApiError
          ? error.status === 0 || (error.status >= 500 && error.status <= 599)
          : isNetworkFailure(error);

      if (canRetry && shouldRetry) {
        await sleep(SAFE_GET_RETRY_DELAY_MS * (i + 1));
        continue;
      }
      if (normalizedMethod === "GET") {
        const cached = await readGetCache<T>(cacheKey);
        if (cached) {
          markServedFromCache();
          return cached.data;
        }
      }
      throw error;
    }
  }
  throw lastError instanceof ApiError ? lastError : new ApiError("Дахин оролдоно уу.", 0);
}

function assertPaginatedShape<T>(data: unknown, status: number): ApiPaginatedData<T> {
  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    "meta" in data &&
    Array.isArray((data as ApiPaginatedData<T>).items) &&
    typeof (data as ApiPaginatedData<T>).meta === "object"
  ) {
    return data as ApiPaginatedData<T>;
  }
  throw new ApiError("Хуудаслалтын хариуны бүтэц буруу байна (items/meta дутуу).", status);
}

/** `data: { items, meta }` бүтэцтэй GET-үүдэд. */
export async function apiRequestPaginated<TItem>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiPaginatedData<TItem>> {
  const data = await apiRequest<unknown>(path, options);
  return assertPaginatedShape<TItem>(data, 200);
}
