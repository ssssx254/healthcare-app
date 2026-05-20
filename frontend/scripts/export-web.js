/**
 * Production web export: .env.production → NODE_ENV=production → expo export -p web
 */
const path = require("path");
const { spawnSync } = require("child_process");
const { loadProductionEnv } = require("./load-production-env");

const frontendRoot = path.join(__dirname, "..");

process.env.NODE_ENV = "production";
const { apiUrl, loaded } = loadProductionEnv({ force: true });

console.log(loaded ? "✓ Loaded .env.production" : "⚠ .env.production missing — using fallback");
console.log("✓ EXPO_PUBLIC_API_URL =", apiUrl);

const exportResult = spawnSync("npx", ["expo", "export", "-p", "web"], {
  cwd: frontendRoot,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

if (exportResult.status !== 0) {
  process.exit(exportResult.status ?? 1);
}

const copyFonts = spawnSync("node", ["scripts/copy-web-icon-font.js"], {
  cwd: frontendRoot,
  stdio: "inherit",
  shell: true,
});

process.exit(copyFonts.status ?? 0);
