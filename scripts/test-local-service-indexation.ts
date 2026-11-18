import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getSeoLandingPage } from "../src/lib/seo-landing-pages";
import { pendingNoIndexSlugs, publicSitemapPaths, sitemapExcludedSlugs, sitemapLastModifiedFor } from "../src/lib/seo";
import { pageCanonical } from "../src/lib/seo-metadata";

const brakes = getSeoLandingPage("hamulce");
assert.ok(brakes, "Brake landing must exist");
assert.notEqual(brakes?.noIndex, true, "Brakes must be indexable");
assert.equal(pendingNoIndexSlugs.has("hamulce"), false);
assert.equal(sitemapExcludedSlugs.has("hamulce"), false);

const coolant = "/wymiana-plynu-chlodniczego-warszawa";
assert.ok(publicSitemapPaths.some(x => x.path === coolant), "Coolant landing must appear in sitemap");
assert.equal(pendingNoIndexSlugs.has(coolant.slice(1)), false);
assert.equal(sitemapExcludedSlugs.has(coolant.slice(1)), false);
assert.ok(sitemapLastModifiedFor(coolant).getTime() >= new Date("2026-11-18T00:00:00.000Z").getTime());
assert.ok(sitemapLastModifiedFor("/hamulce").getTime() >= new Date("2026-11-18T00:00:00.000Z").getTime());
assert.equal(pageCanonical(coolant), "https://www.bess-motors.com"+coolant);

const coolantCode = readFileSync("src/app/wymiana-plynu-chlodniczego-warszawa/page.tsx", "utf8");
assert.match(coolantCode, /export const metadata: Metadata = buildPageMetadata/);
assert.match(coolantCode, /<h1[^>]*>/);
assert.match(coolantCode, /<BookingLink/);
assert.match(coolantCode, /<PhoneLink/);
assert.match(coolantCode, /<StructuredData data=\{schema\}/);
assert.doesNotMatch(coolantCode, /noIndex:\s*true/);
const brakeCode = readFileSync("src/app/[slug]/page.tsx", "utf8");
assert.match(brakeCode, /slug === "hamulce" \? <BrakesLocalContent/);
const localContent = readFileSync("src/components/seo/BrakesLocalContent.tsx", "utf8");
assert.match(localContent, /Naprawa i wymiana hamulców w Warszawie/);
assert.match(localContent, /<BookingLink/);
console.log("local service indexation regression checks OK");
