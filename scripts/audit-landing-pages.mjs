#!/usr/bin/env node
/**
 * Audits all 27 SEO landing slugs for required marketing blocks.
 * Run: node scripts/audit-landing-pages.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function extractSlugs(ts) {
  const m = [...ts.matchAll(/slug:\s*"([^"]+)"/g)];
  return m.map((x) => x[1]);
}

const pagesPath = join(root, "src/lib/seo-landing-pages.ts");
const profilesPath = join(root, "src/lib/seo-landing-slug-profiles.ts");
const contentPath = join(root, "src/lib/service-landing-content.ts");

const slugs = extractSlugs(readFileSync(pagesPath, "utf8"));
const profiles = readFileSync(profilesPath, "utf8");
const content = readFileSync(contentPath, "utf8");

const serviceIdRe = /slug:\s*"([^"]+)"[\s\S]*?serviceId:\s*"([^"]+)"/g;
const serviceMap = {};
let m;
const pagesRaw = readFileSync(pagesPath, "utf8");
while ((m = serviceIdRe.exec(pagesRaw)) !== null) {
  serviceMap[m[1]] = m[2];
}

let failed = 0;
console.log(`Auditing ${slugs.length} landing slugs...\n`);

for (const slug of slugs) {
  const sid = serviceMap[slug];
  const hasProfile = profiles.includes(`${slug}:`) || profiles.includes(`"${slug}":`);
  const hasSteps =
    content.includes(`${sid}: [`) && content.includes("SERVICE_LANDING_STEPS");
  const hasFaq = content.includes(`${sid}:`) && content.includes("SERVICE_LANDING_FAQ_EXTRA");
  const issues = [];
  if (!sid) issues.push("no serviceId");
  if (!hasProfile) issues.push("no slug profile");
  if (sid && !hasSteps && !profiles.includes("steps:")) issues.push("generic steps only");
  const ok = sid && issues.length <= 1;
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "⚠"} /${slug} (${sid ?? "—"}) ${issues.join(", ") || "ok"}`);
}

console.log(`\nTotal: ${slugs.length}, warnings: ${failed}`);
process.exit(failed > 5 ? 1 : 0);
