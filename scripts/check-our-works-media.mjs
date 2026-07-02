import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const src = fs.readFileSync(path.join(root, "src/lib/our-works.ts"), "utf8");
const paths = [...src.matchAll(/["'](\/(?:images|videos)\/[^"']+)["']/g)].map((m) => m[1]);
const uniq = [...new Set(paths)];
const missing = uniq.filter((p) => !fs.existsSync(path.join(root, "public", p.slice(1))));

console.log(`Checked ${uniq.length} media paths`);
if (missing.length) {
  console.error("Missing files:\n" + missing.map((p) => `  ${p}`).join("\n"));
  process.exit(1);
}
console.log("All our-works media files present.");
