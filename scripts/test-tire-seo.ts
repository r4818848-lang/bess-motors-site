/**
 * Warsaw tyre pages stay city-level, and public prices stay tied to the catalogue.
 */
import assert from "node:assert/strict";
import { getPriceItem } from "../src/lib/price-list";
import { seoLandingPages, seoLandingSlugs } from "../src/lib/seo-landing-pages";
import { EXTRA_SEO_SERVICE_PROFILES_BATCH2 } from "../src/lib/seo-extra-service-pages-batch2";
import {
  TIRE_PROMO_EXTRAS,
  TIRE_PROMO_LADDER,
} from "../src/lib/tire-promo-prices";

const cityTyreSlugs = [
  "wulkanizacja-warszawa",
  "wymiana-opon-warszawa",
  "sezonowa-wymiana-opon-warszawa",
  "naprawa-opon-warszawa",
  "wywazanie-kol-warszawa",
  "opony",
] as const;

const districtDoorway =
  /^(wulkanizacja|wymiana-opon|sezonowa-wymiana-opon|naprawa-opon|wywazanie-kol)-(wlochy|okecie|rakow|ochota|ursus|mokotow|sluzewiec|wola|bemowo|ursynow|srodmiescie|zoliborz|bielany|praga|bialoleka|targowek|raszyn|michalowice|piastow|pruszkow|janki|ozarow)/;

for (const slug of seoLandingSlugs) {
  assert.equal(districtDoorway.test(slug), false, `district tyre doorway: ${slug}`);
}

for (const slug of cityTyreSlugs) {
  const page = seoLandingPages.find((item) => item.slug === slug);
  assert.ok(page, slug);
  const meta = `${page.metaTitle} ${page.metaDescription}`;
  assert.match(meta, /Warszawa/);
  assert.equal(meta.includes("Włochy"), false, `${slug} meta still leads with Włochy`);
}

const expected: Array<[string, number, number]> = [
  ["tire_change_r13", 140, 160],
  ["tire_change_r16", 170, 200],
  ["tire_change_r17", 190, 220],
  ["tire_change_r18", 220, 250],
  ["tire_change_r19", 280, 350],
  ["tire_change_r20", 350, 400],
];

for (const [id, now, was] of expected) {
  const item = getPriceItem(id);
  assert.equal(item?.basePrice, now, id);
  assert.equal(item?.listPrice, was, id);
}

assert.equal(TIRE_PROMO_LADDER[0].nowZl, getPriceItem("tire_change_r13")?.basePrice);
assert.equal(TIRE_PROMO_LADDER[0].wasZl, getPriceItem("tire_change_r13")?.listPrice);
assert.equal(TIRE_PROMO_EXTRAS.punctureRepairZl, getPriceItem("puncture_repair")?.basePrice);
assert.equal(TIRE_PROMO_EXTRAS.runFlatPerWheelZl, getPriceItem("runflat_surcharge")?.basePrice);
assert.equal(TIRE_PROMO_EXTRAS.storageSetFromZl, getPriceItem("tire_storage")?.basePrice);
assert.equal(getPriceItem("tire_change_r24")?.priceFrom, true);

for (const slug of ["wulkanizacja-warszawa", "wymiana-opon-warszawa", "sezonowa-wymiana-opon-warszawa"] as const) {
  const table = EXTRA_SEO_SERVICE_PROFILES_BATCH2[slug]?.price?.priceTable ?? [];
  assert.equal(table.length, TIRE_PROMO_LADDER.length, slug);
  assert.ok(table.every((row) => row.compareAtZl != null && row.compareAtZl > row.priceZl), slug);
}

const hub = EXTRA_SEO_SERVICE_PROFILES_BATCH2["wulkanizacja-warszawa"];
const hubText = (hub?.education ?? []).map((block) => block.body.pl).join("\n");
assert.match(hubText, /Aleja Krakowska 48\/52/);
assert.match(hubText, /R24/);
assert.match(hubText, /Okęcia/);
assert.equal(/Bemow[oa].{0,40}\d+ minut/i.test(hubText), false);

console.log("tire seo checks passed");
