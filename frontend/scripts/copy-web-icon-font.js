/**
 * After `expo export -p web`, copy MaterialCommunityIcons to a Firebase-safe path.
 * Firebase may return 500 for URLs containing "node_modules".
 */
const fs = require("fs");
const path = require("path");

const distAssets = path.join(__dirname, "..", "dist", "assets");
const outDir = path.join(distAssets, "fonts");
const outFile = path.join(outDir, "material-community.ttf");

function findMaterialCommunityTtf(dir) {
  if (!fs.existsSync(dir)) return null;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      const nested = findMaterialCommunityTtf(full);
      if (nested) return nested;
    } else if (name.startsWith("MaterialCommunityIcons") && name.endsWith(".ttf")) {
      return full;
    }
  }
  return null;
}

const projectFont = path.join(__dirname, "..", "assets", "fonts", "MaterialCommunityIcons.ttf");
const bundled = findMaterialCommunityTtf(distAssets);
const source = fs.existsSync(projectFont) ? projectFont : bundled;

if (!source) {
  console.error("[copy-web-icon-font] MaterialCommunityIcons.ttf not found. Run expo export first.");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(source, outFile);
console.log(`[copy-web-icon-font] Wrote ${path.relative(process.cwd(), outFile)}`);
