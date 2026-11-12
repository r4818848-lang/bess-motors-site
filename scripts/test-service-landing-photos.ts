import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import type { ServiceId } from "../src/lib/services-catalog";
import { getServiceLandingGalleryTags } from "../src/lib/service-landing-content";
import {
  galleryHrefForService,
  galleryItemMatchesService,
  landingServicePhotos,
  landingWorkshopPhotos,
} from "../src/lib/service-landing-photos";

function srcs(serviceId: ServiceId): string[] {
  return landingServicePhotos(serviceId).map((photo) => photo.src);
}

function includesAny(list: string[], parts: string[]): boolean {
  return list.some((src) => parts.some((part) => src.includes(part)));
}

function includesNone(list: string[], parts: string[]): boolean {
  return list.every((src) => parts.every((part) => !src.includes(part)));
}

const oil = srcs("oil");
const brakes = srcs("brakePads");
const tires = srcs("tires");
const climate = srcs("acRefill");
const engine = srcs("engine");
const suspension = srcs("suspension");

assert.ok(oil.length > 0, "oil photos");
assert.ok(includesAny(oil, ["oil-change"]));
assert.ok(includesNone(oil, ["brake", "tire-", "radiator", "alternator", "suspension"]));

assert.ok(brakes.length > 0, "brake photos");
assert.ok(includesAny(brakes, ["brake", "brakes-discs"]));
assert.ok(includesNone(brakes, ["oil-change", "tire-", "ac-recharge", "radiator"]));

assert.ok(tires.length > 0, "tire photos");
assert.ok(includesAny(tires, ["tire-"]));
assert.ok(includesNone(tires, ["oil-change", "brake-pads", "ac-recharge", "radiator"]));

assert.ok(climate.length > 0, "climate photos");
assert.ok(includesAny(climate, ["ac-"]));
assert.ok(includesNone(climate, ["oil-change", "brake", "tire-", "radiator-replacement"]));

assert.ok(engine.length > 0, "engine photos");
assert.ok(includesAny(engine, ["valve-adjustment", "timing-belt"]));
assert.ok(includesNone(engine, ["oil-change", "brake", "tire-", "ac-recharge"]));

assert.ok(suspension.length > 0, "suspension photos");
assert.ok(includesAny(suspension, ["audi-a6-suspension"]));
assert.ok(includesNone(suspension, ["oil-change", "brake", "tire-", "ac-recharge"]));

assert.equal(srcs("diagnostic").length, 0);
assert.equal(srcs("alignment").length, 0);

for (const serviceId of ["oil", "brakePads", "tires", "acRefill", "engine", "suspension"] as ServiceId[]) {
  for (const src of srcs(serviceId)) {
    assert.equal(src.includes("hero-car"), false, src);
    assert.equal(src.includes("/images/reels/"), false, src);
    assert.equal(/\.(mp4|mov|webm)$/i.test(src), false, src);
    assert.equal(existsSync(`public${src}`), true, src);
  }
}

const workshop = landingWorkshopPhotos().map((photo) => photo.src);
assert.ok(workshop.length >= 3);
assert.ok(workshop.every((src) => !src.includes("tire-service")));
assert.ok(workshop.every((src) => existsSync(`public${src}`)));

assert.equal(galleryHrefForService("oil"), "/gallery?tab=works&service=oil");
assert.equal(galleryHrefForService("brakesFull"), "/gallery?tab=works&service=brakePads");
assert.equal(galleryHrefForService("acRepair"), "/gallery?tab=works&service=acRefill");
assert.equal(galleryHrefForService("diagnostic"), "/gallery?tab=works");

assert.equal(galleryItemMatchesService("wymiana oleju BMW", ["olej", "oil"]), true);
assert.equal(galleryItemMatchesService("wymiana klocków", ["olej", "oil"]), false);
assert.equal(galleryItemMatchesService("serwis BMW", ["serwis", "bmw"]), false);
assert.equal(galleryItemMatchesService("serwis klimatyzacji", ["klim", "ac"]), true);

const oilTags = getServiceLandingGalleryTags("oil") ?? [];
const acTags = getServiceLandingGalleryTags("acRefill") ?? [];
assert.equal(oilTags.includes("serwis"), false);
assert.equal(acTags.includes("ac"), false);
assert.equal(acTags.includes("radiator"), false);

console.log("service landing photos ok", {
  oil: oil.length,
  brakes: brakes.length,
  tires: tires.length,
  climate: climate.length,
  engine: engine.length,
  suspension: suspension.length,
});
