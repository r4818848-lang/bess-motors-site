import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { claimConversionSlot, planThankYouConversions } from "../src/lib/conversion-count";
import { classifyQuery, describePeriodWindow, periodsAreComparable, rollupQueries, validateGscExport } from "../src/lib/gsc-analysis";
import { periodFromTables } from "../src/lib/gsc-import";
import { describeGbpAccess, gbpDrafts, MAPS_RANK_STATUS } from "../src/lib/seo-growth/gbp";
import { imageContainsExif, inspectImage } from "../src/lib/seo-growth/image-safety";
import { attachPhoto, createCase, listPublishedCases, publicPhoto, transitionCase, updateCase } from "../src/lib/seo-growth/case-store";
import { adsConversionConfigured, analyticsParamsDropPersonalData, thankYouEventsOnce } from "../src/lib/seo-growth/conversions";
import { buildPanelSnapshot } from "../src/lib/seo-growth/panel";
import { publishBlockers } from "../src/lib/seo-growth/work-cases";

process.env.SEO_CASE_STORE_DIR = mkdtempSync(join(tmpdir(), "seo-cases-"));

const gbp = describeGbpAccess({ GBP_ACCOUNT_ID: "not-a-confirmed-grant" });
assert.equal(gbp.api, "UNAVAILABLE");
assert.equal(gbp.writes, "disabled");
assert.equal(JSON.stringify(gbp).includes("not-a-confirmed-grant"), false);
assert.equal(gbpDrafts().every((draft) => draft.autoPublish === false && draft.status === "draft"), true);
assert.equal(MAPS_RANK_STATUS.status, "NO_DATA");
assert.equal(MAPS_RANK_STATUS.organicPositionUsedAsMaps, false);

const empty = validateGscExport("queries.csv", "");
assert.equal(empty.status, "NO_DATA");
const invalid = validateGscExport("queries.csv", "foo,bar\n1,2\n");
assert.equal(invalid.status, "INVALID");
const csv = [
  "query,clicks,impressions,ctr,position",
  "bess motors,2,10,20%,1",
  "wulkanizacja warszawa włochy,1,40,1%,12",
  "mechanik pruszków,0,5,0%,30",
  "(other),1,1,100%,1",
].join("\n");
const parsed = validateGscExport("queries.csv", csv);
assert.equal(parsed.status, "OK");
const classes = rollupQueries(parsed.table.rows);
assert.equal(classes.branded.length, 1);
assert.equal(classes.byDistrict.P1.length, 1);
assert.equal(classes.byDistrict.P3.length, 1);
assert.equal(classes.warsawCommercial.length, 1);
assert.equal(classes.byService.tires.queries, 1);
assert.equal(parsed.table.rows.some((row) => row.key === "(other)"), true);
assert.equal(classes.branded.concat(classes.nonBranded).some((row) => row.anonymized), false);
const location = classifyQuery({ key: "mechanik włochy", clicks: 0, impressions: 1, ctr: 0, position: 10 });
assert.deepEqual(location.districtTiers, ["P1"]);
assert.equal(location.warsawCommercial, false);

const dates = ["date,clicks,impressions,ctr,position", "2026-10-01,1,2,50%,3", "2026-10-02,1,2,50%,4"].join("\n");
const period = periodFromTables([validateGscExport("dates.csv", dates).table]);
assert.equal(describePeriodWindow(period).uniqueDays, 2);
assert.equal(periodsAreComparable(period, period).comparable, true);
const oneDay = periodFromTables([
  validateGscExport("dates.csv", "date,clicks,impressions,ctr,position\n2026-11-01,1,1,100%,1").table,
]);
assert.equal(periodsAreComparable(period, oneDay).reason, "unequal_length");
assert.equal(periodsAreComparable(period, oneDay).comparable, false);

const snapshot = buildPanelSnapshot({ env: {}, cases: [], actions: [], gscTotals: null, gscAvailable: false });
assert.equal(snapshot.searchConsole.status, "NO_DATA");
assert.equal(snapshot.searchConsole.clicks.value, null);
assert.equal(snapshot.bookings.status, "NO_DATA");
assert.equal(snapshot.gbp.api, "UNAVAILABLE");

assert.equal(adsConversionConfigured({}).status, "BLOCKED");
assert.deepEqual(analyticsParamsDropPersonalData({ phone: "+48123456789", content_name: "hero" }), { content_name: "hero" });
assert.deepEqual(thankYouEventsOnce("booking", false), []);
assert.equal(planThankYouConversions({ kind: "booking", submittedAt: "2026-11-11T10:00:00.000Z" }, true).includes("booking_request_submit_success"), true);
const memory = { value: "", getItem: () => memory.value, setItem: (_key: string, next: string) => { memory.value = next; } };
assert.equal(claimConversionSlot("booking:1", memory), true);
assert.equal(claimConversionSlot("booking:1", memory), false);

const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0xff, 0xd9]);
assert.equal(imageContainsExif(jpeg), true);
const cleaned = inspectImage(jpeg);
assert.equal(cleaned.ok, true);
if (cleaned.ok) assert.equal(imageContainsExif(cleaned.image.bytes), false);
assert.equal(inspectImage(Uint8Array.from(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))).ok, false);

const blocked = createCase({
  make: "Audi",
  model: "Q5",
  problemPl: "telefon +48 791 257 229",
  diagnosisPl: "opis",
  workPl: "wymiana",
  serviceId: "tires",
});
assert.equal(blocked.ok, false);

const created = createCase({
  make: "Audi",
  model: "Q5",
  year: "2018",
  problemPl: "Bicie kierownicy przy hamowaniu.",
  diagnosisPl: "Zużyte klocki przedniej osi.",
  workPl: "Wymiana klocków przednich.",
  serviceId: "brakes",
});
assert.equal(created.ok, true);
if (!created.ok) throw new Error("case");
assert.equal(listPublishedCases().length, 0);
assert.equal(transitionCase(created.story.id, "published").ok, false);
const photo = attachPhoto(created.story.id, jpeg);
assert.equal(photo.ok, true);
assert.equal(transitionCase(created.story.id, "review").ok, true);
assert.equal(transitionCase(created.story.id, "approved").ok, true);
const published = transitionCase(created.story.id, "published");
assert.equal(published.ok, true);
assert.equal(listPublishedCases().length, 1);
if (photo.ok) {
  assert.ok(publicPhoto(created.story.id, photo.photoId));
}
assert.equal(publicPhoto(created.story.id, "missing"), null);
const edited = updateCase(created.story.id, { notesPl: "Bez tablicy i bez VIN." });
assert.equal(edited.ok, true);
if (edited.ok) assert.ok(edited.story.history.length >= 4);
const archived = transitionCase(created.story.id, "archived");
assert.equal(archived.ok, true);
assert.equal(listPublishedCases().length, 0);
if (archived.ok) assert.equal(publishBlockers(archived.story).includes("not_approved"), true);

console.log("seo sprint 5 ok");
