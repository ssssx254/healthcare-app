/**
 * One-off: replace paired light/dark Tailwind classes with semantic app-* tokens.
 * Run: node scripts/migrate-theme-classes.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DIRS = ["app", "components", "hooks"];

const REPLACEMENTS = [
  ["bg-slate-50 dark:bg-slate-950", "bg-app-bg"],
  ["bg-slate-950 dark:bg-slate-950", "bg-app-bg"],
  ["bg-white dark:bg-slate-900/95", "bg-app-card"],
  ["bg-white dark:bg-slate-900/90", "bg-app-card"],
  ["bg-white dark:bg-slate-900/80", "bg-app-card"],
  ["bg-white dark:bg-slate-900", "bg-app-card"],
  ["bg-slate-100 dark:bg-slate-800/80", "bg-app-muted"],
  ["bg-slate-100 dark:bg-slate-800/40", "bg-app-muted"],
  ["bg-slate-100 dark:bg-slate-800", "bg-app-muted"],
  ["bg-slate-50 dark:bg-slate-800/40", "bg-app-muted"],
  ["bg-slate-50 dark:bg-slate-800", "bg-app-muted"],
  ["text-slate-900 dark:text-slate-50", "text-app-text"],
  ["text-slate-800 dark:text-slate-100", "text-app-text"],
  ["text-slate-800 dark:text-slate-50", "text-app-text"],
  ["text-slate-700 dark:text-slate-200", "text-app-text-secondary"],
  ["text-slate-700 dark:text-slate-300", "text-app-text-secondary"],
  ["text-slate-600 dark:text-slate-300", "text-app-text-secondary"],
  ["text-slate-600 dark:text-slate-400", "text-app-text-muted"],
  ["text-slate-500 dark:text-slate-400", "text-app-text-muted"],
  ["text-slate-500 dark:text-slate-500", "text-app-text-muted"],
  ["text-slate-400 dark:text-slate-500", "text-app-text-muted"],
  ["border-slate-200/95 dark:border-slate-700/80", "border-app-border"],
  ["border-slate-200 dark:border-slate-700", "border-app-border"],
  ["border-slate-300 dark:border-slate-600", "border-app-border-strong"],
  ["border-slate-300 dark:border-slate-500", "border-app-border-strong"],
  ["active:bg-slate-100 dark:active:bg-slate-800", "active:bg-app-muted"],
  ["hover:bg-slate-100 dark:hover:bg-slate-800", "active:bg-app-muted"],
  ["border border-slate-200 bg-white shadow-md dark:border-slate-700/80 dark:bg-slate-900/95", "border border-app-border bg-app-card shadow-md"],
  ["bg-slate-50 px-3.5 py-3 active:opacity-85 dark:border-slate-700 dark:bg-slate-900/70", "bg-app-muted px-3.5 py-3 active:opacity-85"],
  ["border border-slate-200/80 bg-slate-50", "border border-app-border bg-app-muted"],
  ["dark:bg-slate-800", "bg-app-muted"],
  ["dark:bg-slate-900", "bg-app-card"],
  ["dark:bg-slate-950", "bg-app-bg"],
  ["dark:text-slate-100", "text-app-text"],
  ["dark:text-slate-200", "text-app-text-secondary"],
  ["dark:text-slate-300", "text-app-text-secondary"],
  ["dark:text-slate-400", "text-app-text-muted"],
  ["dark:border-slate-700", "border-app-border"],
  ["dark:border-slate-600", "border-app-border-strong"],
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(tsx|ts)$/.test(name)) files.push(p);
  }
  return files;
}

let changed = 0;
for (const sub of DIRS) {
  const dir = path.join(ROOT, sub);
  if (!fs.existsSync(dir)) continue;
  for (const file of walk(dir)) {
    let text = fs.readFileSync(file, "utf8");
    const orig = text;
    for (const [from, to] of REPLACEMENTS) {
      text = text.split(from).join(to);
    }
    if (text !== orig) {
      fs.writeFileSync(file, text, "utf8");
      changed++;
      console.log("updated:", path.relative(ROOT, file));
    }
  }
}
console.log(`Done. ${changed} files changed.`);
