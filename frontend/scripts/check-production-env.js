/**
 * Production web build-ийн өмнө EXPO_PUBLIC_API_URL шалгана.
 */
const fs = require("fs");
const {
  ENV_FILE,
  getProductionApiUrlFromFile,
  PRODUCTION_API_URL_FALLBACK,
} = require("./load-production-env");

if (!fs.existsSync(ENV_FILE)) {
  console.error("❌ frontend/.env.production олдсонгүй.");
  console.error("   copy .env.production.example .env.production");
  console.error(`   EXPO_PUBLIC_API_URL=${PRODUCTION_API_URL_FALLBACK}`);
  process.exit(1);
}

const url = getProductionApiUrlFromFile();

if (!url || url.includes("YOUR_BACKEND") || url.includes("localhost") || url.includes("127.0.0.1")) {
  console.error("❌ .env.production дахь EXPO_PUBLIC_API_URL буруу эсвэл placeholder байна:");
  console.error("   ", url || "(хоосон)");
  process.exit(1);
}

console.log("✓ Production API:", url);
