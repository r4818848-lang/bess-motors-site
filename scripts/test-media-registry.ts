import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { BESS_MEDIA_REGISTRY, mediaForService } from "../src/lib/bess-media-registry";

assert.ok(BESS_MEDIA_REGISTRY.length >= 20);
for (const item of BESS_MEDIA_REGISTRY) {
  assert.equal(existsSync(`public${item.src}`), true, item.src);
}
assert.ok(mediaForService("oil").some((item) => item.kind === "photo"));
assert.ok(mediaForService("tires").length > 0);
assert.ok(mediaForService("brakes").length > 0);
console.log("media registry ok", BESS_MEDIA_REGISTRY.length);
