import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { enhancementServices, getEnhancementService, allEnhancementSlugs } from "../src/lib/enhancement-services";
import { AMBIENT_LIGHTING_PHOTOS, SOUNDPROOFING_PHOTOS, STAR_HEADLINER_PHOTOS } from "../src/lib/enhancement-gallery";
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

const starlight = getEnhancementService("gwiezdne-niebo-w-samochodzie-warszawa");
assert.ok(starlight, "Published starlight headliner landing must exist");
assert.equal(starlight.category, "lighting", "Match supported enhancement service taxonomy");
assert.match(starlight.metaTitle, /gwiezdnego nieba.*Warszawa/);
assert.deepEqual(starlight.photos, STAR_HEADLINER_PHOTOS);
assert.equal(starlight.photos?.length, 5);
assert.ok(starlight.faq.some(q => /Włochy/.test(q.question + " " + q.answer)));
assert.ok(starlight.faq.some(q => /kurtyny/.test(q.question + " " + q.answer)), "Electrical and curtain-airbag safety notes");
assert.ok(starlight.scope.length >= 4);
for (const photo of starlight.photos ?? []) {
  assert.match(photo.src, /^\/images\/enhancements\/star-headliner\/.+\.jpg$/);
  assert.ok(photo.alt.length > 45, "Clear image alt describing what is actually visible");
  assert.ok(photo.width >= 800 && photo.height >= 1500, "Dimensions for source photo");
  const local = join("public", photo.src);
  assert.ok(existsSync(local), "Missing star headliner gallery image: " + local);
  assert.ok(statSync(local).size > 100_000, "Original photo appears to be truncated: " + local);
  const magic = readFileSync(local).subarray(0, 3);
  assert.deepEqual([...magic], [0xff, 0xd8, 0xff], "JPEG image signature");
}
assert.equal(new Set(starlight.photos?.map(p => p.src)).size, 5, "Star gallery must have 5 distinct shots");
assert.ok(!JSON.stringify(enhancementServiceSchema(starlight)).includes('"offers"'), "No invented price schema");

const carplay = getEnhancementService("montaz-apple-carplay-warszawa");
assert.ok(carplay, "CarPlay/Android Auto landing must exist");
assert.match(carplay.title, /Apple CarPlay i Android Auto/);
assert.match(carplay.intro, /Google Maps/);
assert.equal(carplay.photos?.length, 4, "Include all four supplied BMW multimedia photos");
assert.ok(carplay.faq.some(f => /Android Auto/.test(f.question + f.answer)));
const carplayGalleryPaths = new Set<string>();
for (const photo of carplay.photos ?? []) {
  assert.ok(photo.src.startsWith("/images/enhancements/carplay/"), photo.src);
  assert.ok(photo.src.endsWith(".jpg"), photo.src);
  assert.ok(photo.alt.includes("BMW"), "Photo must describe the demonstrated BMW Android Auto");
  assert.ok(photo.width >= 800 && photo.height >= 800);
  assert.ok(!carplayGalleryPaths.has(photo.src), "No duplicate BMW photos");
  carplayGalleryPaths.add(photo.src);
  const local = join("public", photo.src);
  assert.ok(existsSync(local), "Missing original BMW photo: " + local);
  assert.ok(statSync(local).size > 50_000, "Unexpectedly small photo: " + local);
  const jpegMagic = readFileSync(local).subarray(0, 3);
  assert.equal(jpegMagic[0], 0xff);
  assert.equal(jpegMagic[1], 0xd8);
  assert.equal(jpegMagic[2], 0xff);
}
const homepage = readFileSync("src/components/home/SameDayServices.tsx", "utf8");
assert.match(homepage, /bmw-android-auto-cockpit\.jpg/);
assert.match(homepage, /c\.carplay/);
assert.match(homepage, /c\.starSky/, "Star headliner card on homepage in four languages");
assert.match(homepage, /gwiezdne-niebo-gotowy-efekt\.jpg/);
assert.match(readFileSync("src/components/home/HomeSeoServiceLinks.tsx", "utf8"), /Montaż Apple CarPlay i Android Auto/);

// Keep new Warsaw services answerable by search and AI without deceptive claims.
assert.ok(ambient.faq.some(q => /Gdzie w Warszawie/.test(q.question)));
assert.ok(ambient.faq.some(q => /uniwersalny zestaw LED/.test(q.question + q.answer)));
assert.ok(soundproof.faq.some(q => /Włochy/.test(q.question + q.answer)));
assert.ok(carplay.faq.some(q => /Gdzie w Warszawie/.test(q.question)));
const seoLinksSource = readFileSync("src/components/home/HomeSeoServiceLinks.tsx", "utf8");
const seoLinkHrefs = [...seoLinksSource.matchAll(/\\{ href: "([^"]+)", label:/g)].map(m => m[1]);
assert.equal(new Set(seoLinkHrefs).size, seoLinkHrefs.length, "Homepage SEO links must not reuse the same href as React keys");

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
assert.match(page, /customization_" \+ service\.slug \+ "_whatsapp"/, "WhatsApp clicks need service-specific GA4 attribution");
assert.match(page, /customization_" \+ service\.slug \+ "_call"/, "Phone clicks need service-specific GA4 attribution");
for (const slug of ["oswietlenie-ambientowe-samochodu-warszawa", "wygluszenie-samochodu-warszawa", "montaz-apple-carplay-warszawa", "gwiezdne-niebo-w-samochodzie-warszawa"]) {
  assert.ok(page.includes('href="/' + slug + '"'), "Customization hub must link explicitly to " + slug);
}
assert.match(page, /Jaką zmianę we wnętrzu auta wybrać/, "Helpful comparison on personalization hub");
assert.match(page, /Apple CarPlay i Android Auto/, "Both multimedia platforms visible on hub");
const route = readFileSync("src/app/[slug]/page.tsx", "utf8");
assert.match(route, /uniwersalnego LED/, "Hub metadata should cover universal LED");
assert.match(route, /Android Auto/, "Hub metadata should cover Android Auto");
const sitemap = readFileSync("src/app/sitemap.ts", "utf8");
assert.match(sitemap, /allEnhancementSlugs/);
assert.match(sitemap, /"montaz-apple-carplay-warszawa"/, "Updated CarPlay page must have new sitemap lastmod");
assert.match(sitemap, /"gwiezdne-niebo-w-samochodzie-warszawa"/, "New page sitemap lastmod");
console.log("Customization: ambient 19 + soundproofing 3 + CarPlay BMW 4 + starlight headliner 5 photos, hub links, SEO and schema OK");
