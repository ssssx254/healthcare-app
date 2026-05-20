/**
 * `.env.production` уншиж `process.env` дээр EXPO_PUBLIC_* тохируулна.
 * `export:web` болон `app.config.ts` хоёуланд ашиглана.
 */
const fs = require("fs");
const path = require("path");

const ENV_FILE = path.join(__dirname, "..", ".env.production");

/** Production web deploy — env алдагдахгүй сүүлийн fallback */
const PRODUCTION_API_URL_FALLBACK = "https://healthcare-app-8bwy.onrender.com/api";

function parseEnvFile(text) {
  /** @type {Record<string, string>} */
  const vars = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function readProductionEnvFile() {
  if (!fs.existsSync(ENV_FILE)) {
    return null;
  }
  return parseEnvFile(fs.readFileSync(ENV_FILE, "utf8"));
}

/**
 * @param {{ force?: boolean }} [options]
 * @returns {{ apiUrl: string; appEnv: string; loaded: boolean }}
 */
function loadProductionEnv(options = {}) {
  const parsed = readProductionEnvFile();
  if (!parsed) {
    return {
      apiUrl: process.env.EXPO_PUBLIC_API_URL?.trim() || PRODUCTION_API_URL_FALLBACK,
      appEnv: process.env.EXPO_PUBLIC_APP_ENV?.trim() || "production",
      loaded: false,
    };
  }

  const keys = Object.keys(parsed).filter(
    (k) => k.startsWith("EXPO_PUBLIC_") || k === "NODE_ENV",
  );

  for (const key of keys) {
    if (options.force || !process.env[key]) {
      process.env[key] = parsed[key];
    }
  }

  if (!process.env.EXPO_PUBLIC_APP_ENV) {
    process.env.EXPO_PUBLIC_APP_ENV = "production";
  }

  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL?.trim() ||
    parsed.EXPO_PUBLIC_API_URL?.trim() ||
    PRODUCTION_API_URL_FALLBACK;

  if (!process.env.EXPO_PUBLIC_API_URL) {
    process.env.EXPO_PUBLIC_API_URL = apiUrl;
  }

  return {
    apiUrl,
    appEnv: process.env.EXPO_PUBLIC_APP_ENV || "production",
    loaded: true,
  };
}

function getProductionApiUrlFromFile() {
  const parsed = readProductionEnvFile();
  const fromFile = parsed?.EXPO_PUBLIC_API_URL?.trim() ?? "";
  if (fromFile && !fromFile.includes("YOUR_BACKEND")) return fromFile;
  return PRODUCTION_API_URL_FALLBACK;
}

module.exports = {
  ENV_FILE,
  PRODUCTION_API_URL_FALLBACK,
  loadProductionEnv,
  readProductionEnvFile,
  getProductionApiUrlFromFile,
};
