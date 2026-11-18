import assert from "node:assert/strict";
import { publicAnalyticsParams, safeGtagEventParams } from "../src/lib/gtag";
import { planThankYouConversions, conversionDedupeKey, claimConversionSlot } from "../src/lib/conversion-count";

const sample = { phone: "+48791257229", vin: "WAUZZZ12345678901", email: "name@example.com", content_name: "booking_header", source: "site", misc: "1234567890" };
assert.deepEqual(publicAnalyticsParams(sample), { content_name: "booking_header", source: "site" });
assert.deepEqual(safeGtagEventParams("click_phone", sample), { content_name: "booking_header", source: "site" });

const destination = "AW-18182816065/Booked_2026";
assert.equal(publicAnalyticsParams({ send_to: destination }).send_to, undefined, "generic PII scrubber stays strict");
assert.equal(safeGtagEventParams("conversion", { send_to: destination, event_label: "thank_you_page", phone: "+48791257229" }).send_to, destination);
assert.equal(safeGtagEventParams("conversion", { send_to: destination, event_label: "thank_you_page", phone: "+48791257229" }).phone, undefined);
assert.equal(safeGtagEventParams("booking_request_submit_success", { send_to: destination }).send_to, undefined, "the Ads routing escape must be conversion-only");
for (const invalid of ["AW-18182816065/abc@example.com", "AW-18182816065", "G-123456", "AW-18182816065/123 456", "AW-18182816065/abc?phone=123456789"]) {
  assert.equal(safeGtagEventParams("conversion", { send_to: invalid }).send_to, undefined, "invalid Ads destination: " + invalid);
}

const booking = planThankYouConversions({kind: "booking", submittedAt: "2026-11-18T09:00:00.000Z"}, true);
assert.deepEqual(booking, ["booking_request_submit_success", "google_ads_booking", "meta_schedule"]);
assert.deepEqual(planThankYouConversions({kind: "booking", submittedAt: "2026-11-18T09:00:00.000Z"}, false), []);
assert.deepEqual(planThankYouConversions({kind: "call", submittedAt: "2026-11-18T09:00:00.000Z"}, true), ["callback_submit_success", "meta_lead"]);
const seen = new Map<string, string>();
const storage = {getItem: (key: string) => seen.get(key) ?? null, setItem: (key: string, value: string) => {seen.set(key, value)}};
const key = conversionDedupeKey("booking", "2026-11-18T09:00:00.000Z");
assert.equal(claimConversionSlot(key, storage), true);
assert.equal(claimConversionSlot(key, storage), false, "a thank-you refresh cannot count a second booking");
console.log("analytics lead events, PII guard and Ads destination checks passed");
