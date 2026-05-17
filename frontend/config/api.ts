import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * =============================================================================
 * Backend API суурь хаяг — зөвхөн энэ файлаас `getApiBaseUrl()` уншигдана.
 * =============================================================================
 *
 * Өөр файлд `http://…` гэж битүү бичихгүй; зөвхөн энд тохируулна.
 *
 * -----------------------------------------------------------------------------
 * Ямар хаяг хэзээ вэ?
 * -----------------------------------------------------------------------------
 *
 * **`localhost` эсвэл `127.0.0.1` (нэг машин дээр)**
 * - Backend таны **хөгжүүлэгчийн компьютер** дээр (`localhost:PORT`) ажиллаж байхад.
 * - **Expo веб** эсвэл **iOS симулятор** зэрэг нь ихэвчлэн хосттой ижил машин тул `localhost` тохирно.
 *
 * **`10.0.2.2` (Android эмулятор)**
 * - **Android эмулятор** дотор `localhost` гэдэг нь **эмулятор өөрөө**, таны PC биш.
 * - Эмулятороос PC дээрх backend руу хандахад ихэвчлэн **`http://10.0.2.2:PORT`** ашиглана (Android-ийн хост loopback alias).
 *
 * **LAN IPv4 (Expo Go, утасны төхөөрөмж)**
 * - **Expo Go**-г **физик утас** дээр ажиллуулж, backend **PC дээр** ажиллаж байвал хоёуланг нэг **Wi‑Fi / сүлжээ**-д оруулна.
 * - Утаснаас `localhost` нь утас өөрөө; PC-ийн хаяг хэрэгтэй → Windows дээр `ipconfig`, Mac/Linux дээр `ifconfig` / `ip addr` гэж **IPv4** (жишээ `192.168.x.x`)-г олж,
 *   `http://ТЭР_IP:PORT/api` гэж бичнэ.
 *
 * -----------------------------------------------------------------------------
 * Давуу эрэмбэ (аль нь заавал бол тэр нь ашиглагдана)
 * -----------------------------------------------------------------------------
 *
 * 1. **`EXPO_PUBLIC_API_URL`** — төслийн үндсэн арга. `.env` эсвэл shell орчны хувьсагч:
 *    `EXPO_PUBLIC_API_URL=http://192.168.1.50:4000/api`
 * 2. **`app.json` → `expo.extra.apiUrl`** — багтаамж дээр тогтмол override (хоосон биш бол л уншигдана).
 * 3. **Доорх `API_BASE_PRESET`** — дээрх хоёр байхгүй үед ашиглагдах **анхдагч** сонголт.
 */

/** Backend-ийн HTTP порт (таны Node сервертэй тааруулна). */
export const API_SERVER_PORT = 4000;

const API_PATH_SUFFIX = "/api";

/** Хуулбарлаж `.env` эсвэл `API_BASE_PRESET`-д ашиглах жишээ суурь хаягууд (зөвхөн санамж). */
export const API_URL_EXAMPLES = {
  /** Нэг машин: Expo (веб/iOS сим) + backend зэрэг PC дээр */
  sameMachine: `http://localhost:${API_SERVER_PORT}${API_PATH_SUFFIX}`,
  /** Android эмулятор → хост (хөгжүүлэгчийн PC) дээрх backend */
  androidEmulator: `http://10.0.2.2:${API_SERVER_PORT}${API_PATH_SUFFIX}`,
  /** Expo Go утас → LAN дээрх PC (IP-г өөрийн сүлжээнд тааруулж солино) */
  lanDevice: `http://192.168.1.10:${API_SERVER_PORT}${API_PATH_SUFFIX}`,
} as const;

export type ApiBasePreset = keyof typeof API_URL_EXAMPLES;

/**
 * Орчны хувьсагч болон `extra` байхгүй үед ашиглах анхдагч.
 * - Зөвхөн **PC дээр** веб/iOS симулятороор тестлэж байвал `sameMachine`
 * - **Android эмулятор** ашиглавал `androidEmulator`
 * - **Утас + Expo Go** бол `lanDevice`-ийн IP-г эхлээд өөрийн PC-ийн LAN болгож засаад эсвэл `EXPO_PUBLIC_API_URL` ашиглана
 */
const API_BASE_PRESET: ApiBasePreset = "sameMachine";

function normalizeBase(url: string): string {
  return url.trim().replace(/\/$/, "");
}

const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;

function inferBaseFromHostRaw(raw: string | undefined | null): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const host = raw.split(":")[0]?.trim().toLowerCase() ?? "";
  if (!host || host === "localhost" || host === "127.0.0.1") return null;
  if (host.includes("exp.direct") || host.includes("ngrok") || host.includes("tunnel")) return null;
  if (!IPV4_RE.test(host) && !host.endsWith(".local")) return null;
  return normalizeBase(`http://${host}:${API_SERVER_PORT}${API_PATH_SUFFIX}`);
}

/**
 * Expo Go дээр `localhost` буруу байхад — `hostUri` эсвэл `debuggerHost`-оос (ихэвчлэн LAN IPv4)
 * backend суурь хаягийг таамаглана. `--tunnel` үед `hostUri` ихэвчлэн exp.direct тул `debuggerHost`
 * (хөгжүүлэгчийн машины LAN IP:порт) дахь IP ашиглагдана.
 */
function inferredDevApiBaseFromExpoHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  const debuggerHost = Constants.expoGoConfig?.debuggerHost;
  return inferBaseFromHostRaw(hostUri) ?? inferBaseFromHostRaw(debuggerHost);
}

/**
 * Бүх `fetch` API дуудлагын суурь URL (`…/api` төгсгөлтэй).
 */
export function getApiBaseUrl(): string {
  const fromEnv =
    typeof process !== "undefined" && typeof process.env?.EXPO_PUBLIC_API_URL === "string"
      ? process.env.EXPO_PUBLIC_API_URL.trim()
      : "";
  if (fromEnv) {
    return normalizeBase(fromEnv);
  }

  const extraUrl = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  if (extraUrl?.apiUrl && String(extraUrl.apiUrl).trim()) {
    return normalizeBase(String(extraUrl.apiUrl));
  }

  const inferred = inferredDevApiBaseFromExpoHost();
  if (inferred && Platform.OS !== "web") {
    return inferred;
  }

  return normalizeBase(API_URL_EXAMPLES[API_BASE_PRESET]);
}
