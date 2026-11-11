/**
 * Warsaw tyre pages stay city-level, and public prices stay tied to the catalogue.
 */
import assert from "node:assert/strict";
import { getPriceItem, isPublicPriceItem } from "../src/lib/price-list";
import { seoLandingPages, seoLandingSlugs } from "../src/lib/seo-landing-pages";
import { SITEMAP_LAST_MODIFIED, sitemapLastModifiedFor } from "../src/lib/seo";
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
assert.equal(TIRE_PROMO_EXTRAS.runFlatPerWheelZl, 15);
assert.equal(TIRE_PROMO_EXTRAS.runFlatPerWheelZl, getPriceItem("runflat_surcharge")?.basePrice);
assert.equal(TIRE_PROMO_EXTRAS.storageLooseSeasonZl, 250);
assert.equal(TIRE_PROMO_EXTRAS.storageRimsSeasonZl, 300);
assert.equal(TIRE_PROMO_EXTRAS.storageLooseSeasonZl, getPriceItem("tire_storage")?.basePrice);
assert.equal(TIRE_PROMO_EXTRAS.storageRimsSeasonZl, getPriceItem("tire_storage_rims")?.basePrice);
assert.equal(getPriceItem("tire_change_r24")?.priceFrom, true);
assert.equal(isPublicPriceItem(getPriceItem("tire_change_r24")!), false);
assert.equal(isPublicPriceItem(getPriceItem("wheel_balance_r24")!), false);
assert.equal(isPublicPriceItem(getPriceItem("low_profile_surcharge")!), false);
assert.equal(isPublicPriceItem(getPriceItem("tire_storage")!), true);
assert.equal(isPublicPriceItem(getPriceItem("runflat_surcharge")!), true);
assert.equal(
  sitemapLastModifiedFor("/blog/wulkanizacja-sezonowa").toISOString(),
  SITEMAP_LAST_MODIFIED.toISOString()
);
assert.equal(
  sitemapLastModifiedFor("/wulkanizacja-warszawa").toISOString(),
  "2026-11-11T11:30:00.000Z"
);
assert.equal(sitemapLastModifiedFor("/cennik").toISOString(), "2026-11-11T11:30:00.000Z");

for (const slug of ["wulkanizacja-warszawa", "wymiana-opon-warszawa", "sezonowa-wymiana-opon-warszawa"] as const) {
  const table = EXTRA_SEO_SERVICE_PROFILES_BATCH2[slug]?.price?.priceTable ?? [];
  assert.equal(table.length, TIRE_PROMO_LADDER.length, slug);
  assert.ok(table.every((row) => row.compareAtZl != null && row.compareAtZl > row.priceZl), slug);
}

const hub = EXTRA_SEO_SERVICE_PROFILES_BATCH2["wulkanizacja-warszawa"];
const hubText = (hub?.education ?? []).map((block) => block.body.pl).join("\n");
assert.match(hubText, /Aleja Krakowska 48\/52/);
assert.match(hubText, /R24 nie jest w ofercie publicznej/);
assert.equal(hubText.includes("450"), false);
assert.match(hubText, /250 zł za sezon/);
assert.match(hubText, /300 zł za sezon/);
assert.equal(/niski profil \(35/i.test(hubText), false);
assert.match(hubText, /Okęcia/);
assert.match(hubText, /nie gwarancja/);
assert.equal(/Bemow[oa].{0,40}\d+ minut/i.test(hubText), false);

console.log("tire seo checks passed");
