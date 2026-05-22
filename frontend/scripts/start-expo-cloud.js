/**
 * Expo Go — Render + Aiven (production API). Web deploy-тэй ижил backend.
 */
const { spawnSync } = require("child_process");
const path = require("path");

const frontendRoot = path.join(__dirname, "..");
const cloudApi = "https://healthcare-app-8bwy.onrender.com/api";

process.env.EXPO_PUBLIC_APP_ENV = "production";
process.env.EXPO_PUBLIC_API_URL = cloudApi;

console.log("Expo Go → production API:", cloudApi);
console.log("(Web deploy ижил: Render → Aiven)\n");

const args = process.argv.slice(2);
const expoArgs = ["expo", "start", "--lan", "-c", ...args.filter((a) => a !== "--")];

const result = spawnSync("npx", expoArgs, {
  cwd: frontendRoot,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
