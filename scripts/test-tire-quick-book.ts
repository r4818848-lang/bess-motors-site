import assert from "node:assert/strict";
import { publicSitemapPaths } from "../src/lib/seo";
import {
  TIRE_PUBLIC_RIM_SIZES,
  buildTireQuickBooking,
  tireQuickAnswerPl,
  tireQuickAppointmentId,
} from "../src/lib/tire-quick-book";
import { isPublishableWorkStory, publishedWorkStories, WORK_STORY_DRAFTS } from "../src/lib/work-stories";
import { planThankYouConversions, claimConversionSlot } from "../src/lib/conversion-count";
import { publicAnalyticsParams } from "../src/lib/gtag";
import { analyticsConsentGranted, readAnalyticsConsent } from "../src/lib/analytics-consent";

const first = buildTireQuickBooking({
  serviceId: "change",
  rim: "r16",
  date: "2026-11-20",
  time: "10:00",
  phone: "791257229",
});
assert.equal(first.ok, true);
if (!first.ok) throw new Error("booking");
const second = buildTireQuickBooking({
  serviceId: "storage",
  rim: "R17",
  date: "2026-11-20",
  time: "10:00",
  phone: "+48 791 257 229",
});
assert.equal(second.ok, true);
if (!second.ok) throw new Error("booking 2");
assert.equal(first.booking.appointmentId, second.booking.appointmentId);
assert.equal(first.booking.appointmentId, tireQuickAppointmentId("+48791257229", "2026-11-20", "10:00"));
assert.notEqual(
  first.booking.appointmentId,
  tireQuickAppointmentId("+48791257229", "2026-11-20", "11:00")
);
assert.equal(first.booking.serviceIds.length, 1);
assert.match(first.booking.comment, /R16/);
assert.equal(first.booking.comment.includes("791257229"), false);
assert.equal(buildTireQuickBooking({ ...{ serviceId: "change", rim: "R24", date: "2026-11-20", time: "10:00", phone: "791257229" } }).ok, false);
assert.equal(TIRE_PUBLIC_RIM_SIZES.includes("R24" as "R13"), false);
assert.match(tireQuickAnswerPl(), /45–90/);
assert.match(tireQuickAnswerPl(), /nie jest w ofercie publicznej/);

assert.equal(publishedWorkStories().length, 0);
assert.equal(publicSitemapPaths.some((item) => item.path === "/realizacje"), false);
assert.equal(
  isPublishableWorkStory({
    ...WORK_STORY_DRAFTS[0],
    published: true,
    photo: "/images/works/example.jpg",
    repairPl: "Wymiana opon. Telefon +48 791 257 229.",
  }),
  false
);

assert.deepEqual(planThankYouConversions(null, true), []);
assert.deepEqual(
  planThankYouConversions({ kind: "booking", submittedAt: "2026-11-11T10:00:00.000Z" }, true),
  ["booking_request_submit_success", "google_ads_booking", "meta_schedule"]
);
assert.deepEqual(
  planThankYouConversions({ kind: "booking", submittedAt: "2026-11-11T10:00:00.000Z" }, false),
  []
);
assert.deepEqual(
  planThankYouConversions({ kind: "call", submittedAt: "2026-11-11T10:00:00.000Z" }, true),
  ["callback_submit_success", "meta_lead"]
);

const memory = new Map<string, string>();
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
};
assert.equal(claimConversionSlot("booking:1", storage), true);
assert.equal(claimConversionSlot("booking:1", storage), false);
assert.equal(readAnalyticsConsent(storage), "unknown");
storage.setItem("bess-cookie-consent", "denied");
assert.equal(analyticsConsentGranted(storage), false);
storage.setItem("bess-cookie-consent", "granted");
assert.equal(analyticsConsentGranted(storage), true);
assert.deepEqual(publicAnalyticsParams({ content_name: "hero", phone: "+48111", clientName: "Jan" }), {
  content_name: "hero",
});

console.log("tire quick book ok");
