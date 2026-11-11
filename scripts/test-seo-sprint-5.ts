import assert from "node:assert/strict";
import { readFileSync, rmSync } from "node:fs";
import { createCanvas } from "@napi-rs/canvas";
import { claimConversionSlot, planThankYouConversions } from "../src/lib/conversion-count";
import { classifyQuery, describePeriodWindow, periodsAreComparable, rollupQueries, validateGscExport } from "../src/lib/gsc-analysis";
import { periodFromTables } from "../src/lib/gsc-import";
import { describeGbpAccess, gbpDrafts, MAPS_RANK_STATUS } from "../src/lib/seo-growth/gbp";
import { imageContainsExif, prepareCaseImage } from "../src/lib/seo-growth/image-safety";
import { createMemoryCaseStore } from "../src/lib/seo-growth/case-memory";
import { createSupabaseCaseRepository } from "../src/lib/seo-growth/case-supabase";
import {
  attachPhoto,
  createCase,
  caseRepository,
  installCaseStoreForTests,
  listActions,
  listCases,
  listPublishedCases,
  localCaseFileExists,
  publicPhoto,
  repositoryForEnv,
  reviewPhoto,
  transitionCase,
  updateCase,
} from "../src/lib/seo-growth/case-store";
import { adsConversionConfigured, analyticsParamsDropPersonalData, thankYouEventsOnce } from "../src/lib/seo-growth/conversions";
import { buildPanelSnapshot } from "../src/lib/seo-growth/panel";
import { publishBlockers } from "../src/lib/seo-growth/work-cases";

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

async function runCaseStore() {
const sql = readFileSync("supabase/drafts/seo-cases.sql", "utf8");
assert.equal(sql.includes("public.crm_store"), false);
assert.match(sql, /bytea/);
assert.match(sql, /for update/);
assert.match(sql, /revoke all on function/);

const closed = repositoryForEnv({});
const refused = await closed.createCase(
  { make: "Audi", model: "Q5", problemPl: "stuk", diagnosisPl: "wahacz", workPl: "wymiana", serviceId: "brakes" },
  "no-store"
);
assert.equal(refused.ok, false);
if (!refused.ok) assert.equal(refused.error, "STORAGE_NOT_CONFIGURED");
assert.equal((await closed.listPublished()).ok, false);
rmSync("data/seo-private", { recursive: true, force: true });
assert.equal(localCaseFileExists(), false);

const secret = "sb_secret_test_key_not_real_value_123456";
const missingRpc = createSupabaseCaseRepository({
  config: { url: "https://example.supabase.co", key: secret },
  fetchImpl: async () => new Response(JSON.stringify({ message: "Could not find the function" }), { status: 404 }),
});
const missing = await missingRpc.listCases();
assert.equal(missing.ok, false);
if (!missing.ok) assert.equal(missing.error, "STORAGE_NOT_CONFIGURED");
assert.equal(JSON.stringify(missing).includes(secret), false);

const canvas = createCanvas(48, 48);
const ctx = canvas.getContext("2d");
ctx.fillStyle = "#2255aa";
ctx.fillRect(0, 0, 48, 48);
const raw = new Uint8Array(canvas.toBuffer("image/jpeg"));
const exif = Uint8Array.from([0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00]);
const withExif = new Uint8Array(raw.length + exif.length);
withExif.set(raw.subarray(0, 2), 0);
withExif.set(exif, 2);
withExif.set(raw.subarray(2), 2 + exif.length);
assert.equal(imageContainsExif(withExif), true);
const cleaned = await prepareCaseImage(withExif);
assert.equal(cleaned.ok, true);
if (cleaned.ok) assert.equal(imageContainsExif(cleaned.image.bytes), false);
const svg = await prepareCaseImage(Uint8Array.from(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>")));
assert.equal(svg.ok, false);
const broken = await prepareCaseImage(Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]));
assert.equal(broken.ok, false);

installCaseStoreForTests(createMemoryCaseStore());
const blocked = await createCase({
  make: "Audi",
  model: "Q5",
  problemPl: "telefon +48 791 257 229",
  diagnosisPl: "opis",
  workPl: "wymiana",
  serviceId: "tires",
});
assert.equal(blocked.ok, false);

const input = {
  make: "Audi",
  model: "Q5",
  year: "2018",
  problemPl: "Bicie kierownicy przy hamowaniu.",
  diagnosisPl: "Zużyte klocki przedniej osi.",
  workPl: "Wymiana klocków przednich.",
  serviceId: "brakes" as const,
};
const created = await createCase(input, "case-once");
const replay = await createCase(input, "case-once");
assert.equal(created.ok && replay.ok && created.story.id === replay.story.id && replay.replayed, true);
const onlyOne = await listCases();
assert.equal(onlyOne.ok && onlyOne.cases.filter((row) => row.workPl === input.workPl).length, 1);
if (!created.ok) throw new Error("case");
let story = created.story;
const hidden = await listPublishedCases();
assert.equal(hidden.ok && hidden.cases.length, 0);
assert.equal((await transitionCase(story.id, story.version, "published")).ok, false);
if (!cleaned.ok) throw new Error("jpeg");
const photo = await attachPhoto(story.id, story.version, cleaned.image.bytes);
assert.equal(photo.ok, true);
if (!photo.ok) throw new Error("photo");
story = photo.story;
const draftPhoto = await publicPhoto(story.id, photo.photoId);
assert.equal(draftPhoto.ok, false);
for (const to of ["review", "approved"] as const) {
  const moved = await transitionCase(story.id, story.version, to);
  assert.equal(moved.ok, true, to);
  if (!moved.ok) throw new Error(to);
  story = moved.story;
}
const early = await transitionCase(story.id, story.version, "published");
assert.equal(early.ok, false);
if (!early.ok) assert.equal(early.error, "photo_not_reviewed");
const reviewed = await reviewPhoto(story.id, photo.photoId, story.version);
assert.equal(reviewed.ok, true);
if (!reviewed.ok) throw new Error("review");
story = reviewed.story;
const published = await transitionCase(story.id, story.version, "published");
assert.equal(published.ok, true);
if (!published.ok) throw new Error("published");
story = published.story;
const visible = await listPublishedCases();
assert.equal(visible.ok && visible.cases.length, 1);
const shown = await publicPhoto(story.id, photo.photoId);
assert.equal(shown.ok, true);
const version = story.version;
const [firstEdit, secondEdit] = await Promise.all([
  updateCase(story.id, version, { notesPl: "pierwsza" }),
  updateCase(story.id, version, { notesPl: "druga" }),
]);
assert.equal(Number(firstEdit.ok) + Number(secondEdit.ok), 1);
story = firstEdit.ok ? firstEdit.story : secondEdit.ok ? secondEdit.story : story;
const failedStore = createMemoryCaseStore(caseRepository().snapshot());
const beforeFail = await failedStore.listCases();
failedStore.failNext();
const failedWrite = await failedStore.createCase(input, "after-fail");
assert.equal(failedWrite.ok, false);
const afterFail = await failedStore.listCases();
assert.equal(beforeFail.ok && afterFail.ok && afterFail.value.length, beforeFail.ok ? beforeFail.value.length : -1);
const restarted = createMemoryCaseStore(caseRepository().snapshot());
installCaseStoreForTests(restarted);
const restored = await listCases();
assert.equal(restored.ok && restored.cases.some((row) => row.id === story.id), true);
const archived = await transitionCase(story.id, restored.ok ? restored.cases.find((row) => row.id === story.id)!.version : 0, "archived");
assert.equal(archived.ok, true);
if (!archived.ok) throw new Error("archive");
const afterArchive = await listPublishedCases();
assert.equal(afterArchive.ok && afterArchive.cases.length, 0);
assert.equal((await publicPhoto(story.id, photo.photoId)).ok, false);
assert.ok(archived.story.history.length >= 4);
assert.equal(publishBlockers(archived.story).includes("not_approved"), true);
const actions = await listActions();
assert.equal(actions.ok && actions.actions.length > 0, true);

console.log("seo sprint 5 ok");
}

runCaseStore().catch((error) => {
  console.error(error);
  process.exit(1);
});
