import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Backend API суурь хаяг — зөвхөн `getApiBaseUrl()` ашиглана (`lib/api/client.ts`).
 *
 * Дараалал (Expo Go `.env` болон static export ижил):
 *   1. `EXPO_PUBLIC_API_URL` (.env)
 *   2. `extra.apiUrl` (app.config build-time)
 *   3. `EXPO_PUBLIC_APP_ENV=production` + хоосон URL → `PRODUCTION_API_URL_FALLBACK` (__DEV__ Expo Go)
 *
 * Expo Go (default): `.env` → `development` + локал backend (`npm start` in backend).
 * Web deploy: зөвхөн `.env.production` → Render (`npm run deploy:web`).
 * Expo + production API турших: `npm run start:cloud`.
 */

export const API_SERVER_PORT = 4000;
const API_PATH_SUFFIX = "/api";

/** Production deploy fallback — `.env.production` / `extra.apiUrl` алдагдсан тохиолдолд */
export const PRODUCTION_API_URL_FALLBACK = "https://healthcare-app-8bwy.onrender.com/api";

export type ApiEnvironment = "development" | "android-emulator" | "production";

/** Зөвхөн хөгжүүлэлтийн fallback (production-д ашиглахгүй). */
export const API_URL_BY_ENV: Record<Exclude<ApiEnvironment, "production">, string> = {
  development: `http://localhost:${API_SERVER_PORT}${API_PATH_SUFFIX}`,
  "android-emulator": `http://10.0.2.2:${API_SERVER_PORT}${API_PATH_SUFFIX}`,
};

/** @deprecated API_URL_BY_ENV.development ашиглана */
export const API_URL_EXAMPLES = {
  sameMachine: API_URL_BY_ENV.development,
  androidEmulator: API_URL_BY_ENV["android-emulator"],
  lanDevice: `http://192.168.1.10:${API_SERVER_PORT}${API_PATH_SUFFIX}`,
} as const;

export type ApiBasePreset = keyof typeof API_URL_EXAMPLES;

function normalizeBase(url: string): string {
  return url.trim().replace(/\/$/, "");
}

function isValidApiBaseUrl(url: string): boolean {
  const u = url.trim();
  if (!u || u.includes("YOUR_BACKEND")) return false;
  if (!__DEV__ && (u.includes("localhost") || u.includes("127.0.0.1"))) return false;
  return /^https?:\/\//i.test(u);
}

const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;

function readExpoPublic(name: string): string {
  if (typeof process !== "undefined" && process.env) {
    const value = process.env[name];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function readExtraApiUrl(): string {
  type ExtraShape = { apiUrl?: string };
  const candidates: (string | undefined)[] = [
    (Constants.expoConfig?.extra as ExtraShape | undefined)?.apiUrl,
    (Constants.manifest as { extra?: ExtraShape } | null)?.extra?.apiUrl,
    (Constants.manifest2 as { extra?: ExtraShape } | null)?.extra?.apiUrl,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return "";
}

/** `EXPO_PUBLIC_APP_ENV` эсвэл production build (`!__DEV__`) */
export function resolveApiEnvironment(): ApiEnvironment {
  const explicit = readExpoPublic("EXPO_PUBLIC_APP_ENV").toLowerCase();
  const extraEnv = String(
    (Constants.expoConfig?.extra as { appEnv?: string } | undefined)?.appEnv ?? "",
  )
    .trim()
    .toLowerCase();
  const resolved = explicit || extraEnv;
  if (resolved === "production" || resolved === "android-emulator" || resolved === "development") {
    return resolved;
  }
  if (!__DEV__) return "production";
  return "development";
}

function inferredDevApiBaseFromExpoHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  const debuggerHost = Constants.expoGoConfig?.debuggerHost;
  for (const raw of [hostUri, debuggerHost]) {
    if (typeof raw !== "string" || !raw.trim()) continue;
    const host = raw.split(":")[0]?.trim().toLowerCase() ?? "";
    if (!host || host === "localhost" || host === "127.0.0.1") continue;
    if (host.includes("exp.direct") || host.includes("ngrok") || host.includes("tunnel")) continue;
    if (!IPV4_RE.test(host) && !host.endsWith(".local")) continue;
    return normalizeBase(`http://${host}:${API_SERVER_PORT}${API_PATH_SUFFIX}`);
  }
  return null;
}

function productionMisconfiguredError(): never {
  throw new Error(
    "EXPO_PUBLIC_API_URL тохируулаагүй байна. Production build-ийн өмнө frontend/.env.production үүсгэж " +
      "Render backend URL-аа оруулна уу (жишээ: https://healthcare-app-8bwy.onrender.com/api).",
  );
}

function resolveConfiguredApiUrl(): string {
  const fromEnv = readExpoPublic("EXPO_PUBLIC_API_URL");
  if (isValidApiBaseUrl(fromEnv)) {
    return normalizeBase(fromEnv);
  }

  const fromExtra = readExtraApiUrl();
  if (isValidApiBaseUrl(fromExtra)) {
    return normalizeBase(fromExtra);
  }

  if (!__DEV__ && isValidApiBaseUrl(PRODUCTION_API_URL_FALLBACK)) {
    return normalizeBase(PRODUCTION_API_URL_FALLBACK);
  }

  return "";
}

/**
 * Бүх REST дуудлагын суурь URL (`…/api`).
 * `EXPO_PUBLIC_API_URL` тохируулсан бол LAN/localhost fallback ашиглахгүй.
 */
export function getApiBaseUrl(): string {
  const appEnv = resolveApiEnvironment();

  const configured = resolveConfiguredApiUrl();
  if (configured) {
    return configured;
  }

  if (appEnv === "production") {
    if (__DEV__ && isValidApiBaseUrl(PRODUCTION_API_URL_FALLBACK)) {
      return normalizeBase(PRODUCTION_API_URL_FALLBACK);
    }
    productionMisconfiguredError();
  }

  if (appEnv === "android-emulator") {
    return normalizeBase(API_URL_BY_ENV["android-emulator"]);
  }

  if (__DEV__ && Platform.OS !== "web") {
    const inferred = inferredDevApiBaseFromExpoHost();
    if (inferred) return inferred;
  }

  return normalizeBase(API_URL_BY_ENV.development);
}

export function isProductionApiBuild(): boolean {
  return resolveApiEnvironment() === "production";
}
