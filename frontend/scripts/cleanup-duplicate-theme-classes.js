const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DIRS = ["app", "components"];

const CLEANUPS = [
  [/border border-slate-200 bg-white /g, ""],
  [/border border-slate-200 /g, "border "],
  [/border-2 border-slate-300 bg-white /g, "border-2 "],
  [/border-slate-300 bg-white /g, ""],
  [/bg-slate-50 /g, ""],
  [/bg-slate-100 /g, ""],
  [/bg-slate-200 /g, ""],
  [/active:bg-slate-100 /g, "active:bg-app-muted "],
  [/dark:active:bg-slate-700/g, ""],
  [/flex-1 bg-slate-50 p-4 bg-app-bg/g, "flex-1 bg-app-bg p-4"],
  [/rounded-xl border border-app-border bg-app-muted px-3 py-2\.5 border-app-border bg-app-muted\/80/g,
    "rounded-xl border border-app-border bg-app-muted/80 px-3 py-2.5"],
  [/border border-slate-300 bg-slate-50 /g, ""],
  [/text-slate-500 text-app-text-secondary/g, "text-app-text-secondary"],
  [/mt-3 h-2 overflow-hidden rounded-full bg-slate-200 bg-app-muted/g,
    "mt-3 h-2 overflow-hidden rounded-full bg-app-muted"],
  [/rounded-2xl border border-slate-200 bg-white px-2/g,
    "rounded-2xl border border-app-border bg-app-card px-2"],
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (/\.(tsx|ts)$/.test(name)) files.push(p);
  }
  return files;
}

let n = 0;
for (const sub of DIRS) {
  const dir = path.join(ROOT, sub);
  for (const file of walk(dir)) {
    let text = fs.readFileSync(file, "utf8");
    const orig = text;
    for (const [re, rep] of CLEANUPS) text = text.replace(re, rep);
    if (text !== orig) {
      fs.writeFileSync(file, text, "utf8");
      n++;
      console.log(path.relative(ROOT, file));
    }
  }
}
console.log(`Cleaned ${n} files.`);
