# BESS MOTORS — conversion measurement / 18 November 2026

## Verified baseline (Google Analytics 4, 28 days)

- 476 sessions, 1,237 page views.
- `booking_request_submit_success`: 15 events; **not** a GA4 key event at the time of inspection.
- `vin_quote_submit_success`: 5 events; **not** a GA4 key event at the time of inspection.
- `InitiateCheckout`: 74 events and 74 GA4 key events; this is a **form-start/click signal**, not a booking.
- Other mixed names: `click_phone` (21), `phone_click` (18), `click_whatsapp` (7), `whatsapp_click` (6). Report separately until GTM and the data stream are audited; these are *not* unique calls or messages.
- `generate_lead`, `Lead`, `Contact` and `engaged_view` also appear in the same property. Their exact originating tags were **not verified**; do not combine counts into one 'total leads'.

## Changes in this release

1. `PhoneOnlyBookingForm` no longer has `data-fbq-track="Lead"` on the submit button. The Meta conversion remains on the thank-you page after successful server submission and is guarded by a per-submission session key.
2. Existing canonical GA4 events remain unchanged: `click_phone`, `click_whatsapp`, `booking_open`, `booking_request_submit_success`, `vin_quote_submit_success`, `callback_submit_success`, `get_directions_click`. Renaming them would split the trend.
3. All 13 personalization landing pages use the tracked WhatsApp and phone link components, without emitting VIN or a pre-filled client message to GA4.
4. Consent-gated Google Analytics 4 and Google Ads now share **one direct gtag.js loader**. Existing GTM container is preserved; tags configured *inside* GTM were not altered and still require audit.
5. Google Ads `conversion` tag now preserves only a validated `AW-<account>/<label>` routing field while continuing to drop client names, VIN, phone and email from analytics parameters.

## GA4 Admin — configuration requiring a property editor

Windsor.ai's GA4 connector is read-only and cannot change Admin settings. In Google Analytics, open **Admin → Data display → Events / Key events** (the exact UI labels can vary):

- Mark `booking_request_submit_success` as a key event, counted per event, if the business treats every successfully saved booking request as a lead.
- Mark `vin_quote_submit_success` as a key event. Do not count opening the form.
- Optionally mark `callback_submit_success` if callback requests are a qualified lead type.
- Review `InitiateCheckout`, `Contact`, `Lead`, `engaged_view`, `mail`, `tg_click`, `whatsapp_click` and other currently marked key events. They are not equivalent to confirmed bookings. **Do not disable existing Google Ads primary goals before checking linked Ads conversions and campaign bid strategies.**
- In Google Ads, choose **one** primary booking conversion source (either a correctly configured Ads conversion tag or a GA4 key event import), and keep secondary engagement conversions as secondary. Do not double-import the same booking action.

## Google Ads configuration status

Vercel Production/Preview environment-key inventory did **not** contain `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_BOOKING` on 2026-11-18. The existing code therefore does **not** send a labelled Ads booking conversion. Obtain the real ID/label in Google Ads → Goals → Conversions and add it to Vercel **only after** checking and approving the conversion strategy. Do not invent a label.

## GTM audit still needed

The published site retains Google Tag Manager (`GTM-NVKV27L8`). Because this sprint cannot read its container tags, the origin of legacy events `phone_click`, `whatsapp_click`, `Contact`, `InitiateCheckout` and duplicate initial page views is not proven. Before removing any GTM tag, inspect Tag Assistant Preview and the published tags for duplicate GA4 config and event rules.

## QA & privacy

- All marketing tags load only after analytics consent is granted.
- Site tracking strips fields that could identify a customer.
- Do not report click_phone as completed phone calls, booking_request_submit_success as arrived customers, or InitiateCheckout as a successful lead.
- Check GA4 DebugView/Realtime with consent granted: booking open → `booking_open`; saved booking → one `booking_request_submit_success`; successful VIN form → one `vin_quote_submit_success`; link clicks → corresponding `click_*` event.
- Verify 7- and 28-day trends in GA4/Search Console after release; changes to key-event designation are not retroactive.

## Follow-up

Track conversion path from Search/Maps/paid/organic social to website → click → successful submission → confirmed visit → paid workshop order. Confirmed visits and revenue require CRM reconciliations; website analytics alone cannot verify them.
