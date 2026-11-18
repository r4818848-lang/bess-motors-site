import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeMarketingAttribution, safeLandingPath } from "../src/lib/utm";
import { mergeStoredDb } from "../src/lib/store";
import { acceptWebsiteInquiry } from "../src/lib/service-leads";

const tagged = normalizeMarketingAttribution({
  utmSource: "google-gmb",
  utmMedium: "organic",
  utmCampaign: "winter_tires_2026",
  landingPage: "https://www.bess-motors.com/wymiana-opon-warszawa?phone=123456789&vin=WAUZZZ12345678901",
  clientName: "Hidden Person",
});
assert.deepEqual(tagged, {
  utmSource: "google-gmb",
  utmMedium: "organic",
  utmCampaign: "winter_tires_2026",
  utmContent: undefined,
  utmTerm: undefined,
  landingPage: "/wymiana-opon-warszawa",
});
assert.equal(safeLandingPath("/booking?phone=500600700&vin=WAUZZZ12345678901"), "/booking");
assert.equal(safeLandingPath("https://attack.example/booking?utm_source=google"), undefined);
assert.equal(normalizeMarketingAttribution({ utmSource: "someone@example.com" }), null);
assert.equal(normalizeMarketingAttribution({ utmSource: "phone123456789" }), null);
assert.equal(normalizeMarketingAttribution({ utmSource: "<script>alert(1)</script>" }), null);
assert.equal(normalizeMarketingAttribution({ utmSource: "chatgpt", utmMedium: "referral", landingPage: "/booking" })?.utmSource, "chatgpt");

const db = mergeStoredDb({ leads: [], callRequests: [] });
const now = new Date("2026-11-18T12:30:00Z");
const input = {
  clientRequestId: "marketing-source-once",
  phone: "+48111222333",
  name: "Test client",
  serviceLabel: "Wymiana opon",
  source: "contacts_form",
  sourceUrl: "/contacts",
  marketing: tagged ?? undefined,
};
const first = acceptWebsiteInquiry(db, input, now, []);
assert.equal(first.created, true);
assert.equal(first.lead.marketing?.utmSource, "google-gmb");
assert.equal(first.lead.marketing?.landingPage, "/wymiana-opon-warszawa");
assert.equal(db.callRequests.length, 1);
assert.equal(db.callRequests[0].marketing?.utmSource, "google-gmb");
assert.equal(first.lead.source, "contacts_form", "form type and marketing channel remain separate");
const replay = acceptWebsiteInquiry(db, input, new Date(now.getTime() + 10_000), []);
assert.equal(replay.created, false);
assert.equal(db.leads.length, 1);
assert.equal(db.callRequests.length, 1);

const api = readFileSync("src/app/api/call-request/route.ts", "utf8");
assert.match(api, /marketing: normalizeMarketingAttribution\(body\.marketing\)/);
assert.match(api, /safeLandingPath\(body\.sourceUrl\)/);
const bookingApi = readFileSync("src/app/api/appointments/route.ts", "utf8");
assert.match(bookingApi, /apt\.marketing = normalizeMarketingAttribution\(apt\.marketing\)/);
assert.match(bookingApi, /marketing: apt\.marketing/);
const contactForm = readFileSync("src/app/contacts/page.tsx", "utf8");
assert.match(contactForm, /marketing: getStoredAttribution\(\)/);
const callAction = readFileSync("src/lib/booking-actions.ts", "utf8");
assert.match(callAction, /marketing: getStoredAttribution\(\)/);
assert.doesNotMatch(callAction, /sourceUrl: typeof window !== "undefined" \? window\.location\.href/);
console.log("marketing attribution: sanitized, persisted, deduplicated and private paths verified");
