import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { enhancementServices, getEnhancementService, allEnhancementSlugs } from "../src/lib/enhancement-services";
import { AMBIENT_LIGHTING_PHOTOS, SOUNDPROOFING_PHOTOS } from "../src/lib/enhancement-gallery";
import { enhancementServiceSchema } from "../src/lib/enhancement-schema";

const ambient = getEnhancementService("oswietlenie-ambientowe-samochodu-warszawa");
assert.ok(ambient, "Universal ambient lighting landing page must exist");
assert.match(ambient.intro, /Uniwersalne oświetlenie ambientowe/);
assert.equal(ambient.photos?.length, 19, "Publish all 19 suitable owner-supplied ambient photos");
assert.deepEqual(ambient.photos, AMBIENT_LIGHTING_PHOTOS);

const soundproof = getEnhancementService("wygluszenie-samochodu-warszawa");
assert.ok(soundproof, "Soundproofing must have its own SEO landing page");
assert.equal(soundproof.category, "comfort");
assert.match(soundproof.metaTitle, /Wygłuszenie samochodu Warszawa/);
assert.match(soundproof.titleRu, /Шумоизоляция/);
assert.ok(soundproof.faq.some(q => /hałas/i.test(q.question + " " + q.answer)));
assert.ok(soundproof.scope.length >= 4);
assert.deepEqual(soundproof.photos, SOUNDPROOFING_PHOTOS);
assert.equal(soundproof.photos?.length, 3, "Use the three uploaded soundproofing installation photos");

const paths = new Set<string>();
for (const photo of [...(ambient.photos ?? []), ...(soundproof.photos ?? [])]) {
  assert.ok(photo.src.startsWith("/images/enhancements/"), photo.src);
  assert.ok(photo.alt.length > 30, "Polish descriptive ALT text is required");
  assert.ok(photo.width >= 500 && photo.height >= 900, "Correct portrait geometry");
  assert.equal(paths.has(photo.src), false, "No repeated gallery assets");
  paths.add(photo.src);
  const local = join("public", photo.src);
  assert.ok(existsSync(local), "Missing actual optimized photo: " + local);
  const size = statSync(local).size;
  assert.ok(size > 7_000 && size < 250_000, "Mobile-optimized WebP size: " + local);
  const header = readFileSync(local).subarray(0, 12);
  assert.equal(header.toString("ascii", 0, 4), "RIFF");
  assert.equal(header.toString("ascii", 8, 12), "WEBP");
}
assert.equal(paths.size, 22);
assert.ok(![...paths].some(p => p.endsWith("ambient-20.webp")), "No watermarked supplier reference photo");
assert.equal(allEnhancementSlugs.includes(soundproof.slug), true);
assert.equal(new Set(enhancementServices.map(s => s.slug)).size, enhancementServices.length);

for (const service of [ambient, soundproof]) {
  const serialized = JSON.stringify(enhancementServiceSchema(service));
  assert.ok(serialized.includes(service.title));
  assert.ok(serialized.includes(service.photos![0].src));
  assert.ok(!serialized.includes("offers"), "Do not invent prices or offer terms");
}
const gallery = readFileSync("src/components/seo/EnhancementPhotoGallery.tsx", "utf8");
assert.match(gallery, /enhancement-photo-gallery/);
assert.match(gallery, /photos\.slice\(0, 6\)/, "Initially load only six photos on mobile");
assert.match(gallery, /loading="lazy"/);
assert.match(gallery, /object-contain/);
assert.match(gallery, /aria-modal="true"/);
assert.match(gallery, /Escape/);
assert.doesNotMatch(gallery, /Realizacje BESS MOTORS/, "Photos must not be claimed as verified workshop cases");
const page = readFileSync("src/components/seo/EnhancementServicePage.tsx", "utf8");
assert.match(page, /EnhancementPhotoGallery/);
const sitemap = readFileSync("src/app/sitemap.ts", "utf8");
assert.match(sitemap, /allEnhancementSlugs/);
console.log("Customization: ambient 19 + soundproofing 3 optimized photos, gallery, SEO and price-free schema OK");
