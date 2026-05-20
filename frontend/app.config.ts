import type { ConfigContext, ExpoConfig } from "expo/config";

// Build/export үед `.env.production` уншина (NODE_ENV=production эсвэл export-web.js)
if (process.env.NODE_ENV === "production") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./scripts/load-production-env.js").loadProductionEnv({ force: true });
}

const apiUrlFromEnv = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";
const appEnvFromEnv = process.env.EXPO_PUBLIC_APP_ENV?.trim() || "development";

/**
 * Expo тохиргоо + build-time API хувьсагч (`EXPO_PUBLIC_*`).
 * Production URL: `.env.production` → `extra.apiUrl` (static web bundle-д embed).
 */
export default ({ config }: ConfigContext): ExpoConfig => ({  ...config,
  name: "MedEasy",
  slug: "servicehub-healthcare",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "servicehub",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#2563EB",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.servicehub.healthcare",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#2563EB",
    },
    package: "com.servicehub.healthcare",
    softwareKeyboardLayoutMode: "resize",
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-asset",
    "expo-notifications",
    [
      "expo-image-picker",
      {
        photosPermission:
          "Эмчийн зураг болон эмнэлгийн лого сонгохын тулд зурагны санд хандах эрх шаардлагатай.",
        cameraPermission: "Эмчийн профайл зураг авахын тулд камерт хандах эрх шаардлагатай.",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: apiUrlFromEnv,
    appEnv: appEnvFromEnv,
  },
});
