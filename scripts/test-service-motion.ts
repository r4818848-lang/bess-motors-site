import assert from "node:assert/strict";
import { motionKindFor } from "../src/components/motion/service-motion-kind";

assert.equal(motionKindFor("wymiana-oleju", "oil"), "oil");
assert.equal(motionKindFor("wulkanizacja-warszawa", "tires"), "tires");
assert.equal(motionKindFor("wymiana-opon-warszawa"), "tires");
assert.equal(motionKindFor("sezonowa-wymiana-opon-warszawa"), "tires");
assert.equal(motionKindFor("hamulce", "brakePads"), "brakes");
assert.equal(motionKindFor("diagnostyka", "diagnostic"), "diagnostic");
assert.equal(motionKindFor("klimatyzacja", "acRefill"), "ac");
assert.equal(motionKindFor("naprawa-klimatyzacji", "acRepair"), "ac");
assert.equal(motionKindFor("zawieszenie", "suspension"), "suspension");
assert.equal(motionKindFor("rozrzad", "timingBelt"), "timing");
assert.equal(motionKindFor("silnik", "engine"), "engine");
assert.equal(motionKindFor("skrzynia-biegow", "transmission"), "transmission");
assert.equal(motionKindFor("elektryka", "electric"), "electric");
assert.equal(motionKindFor("geometria", "alignment"), "workshop");
assert.equal(motionKindFor("przeglad-samochodu"), "checklist");

console.log("service motion kinds ok");
