export type GooglePlaceReview = {
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
  profilePhotoUrl?: string;
};

export type GoogleReviewsStatus =
  | "ok"
  | "missing_api_key"
  | "place_not_found"
  | "places_api_denied"
  | "places_api_error";

export type GooglePlaceReviewsPayload = {
  source: "google" | "unconfigured";
  /** Safe hint for setup — no secrets */
  status?: GoogleReviewsStatus;
  /** Sanitized Google/API hint (no key material) for CRM /ops */
  detail?: string;
  placeName?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  placeId?: string;
  reviews: GooglePlaceReview[];
};

/** Google Maps CID for BESS MOTORS (Aleja Krakowska 48/52) — from Maps feature id 0x684ee899c310ad45 */
export const BESS_MOTORS_GOOGLE_CID = "7516200575228226885";
export const BESS_MOTORS_GOOGLE_FEATURE_ID = "0x0:0x684ee899c310ad45";
export const BESS_MOTORS_MAPS_CID_URL = `https://www.google.com/maps?cid=${BESS_MOTORS_GOOGLE_CID}`;

const CACHE_MS = 6 * 60 * 60 * 1000;
const cacheByLang = new Map<string, { at: number; data: GooglePlaceReviewsPayload }>();

const SEARCH_QUERY =
  "BESS MOTORS serwis samochodowy Aleja Krakowska 48 Warszawa";

function apiKey(): string | null {
  return (
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    null
  );
}

function configuredPlaceId(): string | null {
  const raw =
    process.env.GOOGLE_PLACE_ID?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID?.trim() ||
    null;
  if (!raw) return null;
  return raw.replace(/^places\//, "");
}

function sanitizeDetail(text: string, max = 220): string {
  return text
    .replace(/AIza[0-9A-Za-z_-]{10,}/g, "[api-key]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function mapHttpStatus(status: number): GoogleReviewsStatus {
  if (status === 403 || status === 401) return "places_api_denied";
  return "places_api_error";
}

function legacyStatusToOurs(status: string | undefined): GoogleReviewsStatus {
  if (status === "OK") return "ok";
  if (status === "REQUEST_DENIED" || status === "OVER_QUERY_LIMIT") {
    return "places_api_denied";
  }
  if (status === "NOT_FOUND" || status === "ZERO_RESULTS") {
    return "place_not_found";
  }
  return "places_api_error";
}

type NewPlaceJson = {
  id?: string;
  displayName?: { text?: string };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: {
    rating?: number;
    text?: { text?: string };
    relativePublishTimeDescription?: string;
    authorAttribution?: {
      displayName?: string;
      photoUri?: string;
    };
  }[];
  error?: { message?: string; status?: string };
};

function reviewsFromNewApi(data: NewPlaceJson): GooglePlaceReview[] {
  return (data.reviews ?? [])
    .filter((r) => (r.text?.text?.trim()?.length ?? 0) > 0)
    .map((r) => ({
      author: r.authorAttribution?.displayName?.trim() || "Google",
      rating: r.rating ?? 5,
      text: r.text?.text?.trim() ?? "",
      relativeTime: r.relativePublishTimeDescription ?? "",
      profilePhotoUrl: r.authorAttribution?.photoUri,
    }))
    .slice(0, 8);
}

async function resolvePlaceIdViaNewSearch(
  key: string
): Promise<{ id: string | null; denied: boolean; detail?: string }> {
  const configured = configuredPlaceId();
  if (configured) return { id: configured, denied: false };

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName",
    },
    body: JSON.stringify({
      textQuery: SEARCH_QUERY,
      languageCode: "pl",
      regionCode: "PL",
      maxResultCount: 1,
    }),
  });

  const bodyText = await res.text();
  if (!res.ok) {
    console.warn("[google-reviews] searchText", res.status, bodyText.slice(0, 400));
    return {
      id: null,
      denied: res.status === 403 || res.status === 401,
      detail: sanitizeDetail(`Places New searchText HTTP ${res.status}: ${bodyText}`),
    };
  }

  let data: { places?: { id?: string }[] };
  try {
    data = JSON.parse(bodyText) as { places?: { id?: string }[] };
  } catch {
    return { id: null, denied: false, detail: "Places New searchText: invalid JSON" };
  }

  const id = data.places?.[0]?.id?.replace(/^places\//, "") ?? null;
  return { id, denied: false };
}

async function fetchViaPlacesNew(
  key: string,
  languageCode: string
): Promise<GooglePlaceReviewsPayload | null> {
  const resolved = await resolvePlaceIdViaNewSearch(key);
  if (!resolved.id) {
    return {
      source: "unconfigured",
      status: resolved.denied ? "places_api_denied" : "place_not_found",
      detail: resolved.detail,
      reviews: [],
    };
  }

  const placeResource = resolved.id.startsWith("places/")
    ? resolved.id
    : `places/${resolved.id}`;
  const res = await fetch(`https://places.googleapis.com/v1/${placeResource}`, {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "id,displayName,rating,userRatingCount,googleMapsUri,reviews",
      "X-Goog-Language-Code": languageCode,
    },
    next: { revalidate: 21600 },
  });

  const bodyText = await res.text();
  if (!res.ok) {
    console.warn("[google-reviews] Places New details", res.status, bodyText.slice(0, 400));
    return {
      source: "unconfigured",
      status: mapHttpStatus(res.status),
      detail: sanitizeDetail(`Places New details HTTP ${res.status}: ${bodyText}`),
      reviews: [],
    };
  }

  let data: NewPlaceJson;
  try {
    data = JSON.parse(bodyText) as NewPlaceJson;
  } catch {
    return {
      source: "unconfigured",
      status: "places_api_error",
      detail: "Places New details: invalid JSON",
      reviews: [],
    };
  }

  const placeId = (data.id ?? resolved.id).replace(/^places\//, "");
  return {
    source: "google",
    status: "ok",
    placeName: data.displayName?.text,
    rating: data.rating,
    userRatingCount: data.userRatingCount,
    googleMapsUri: data.googleMapsUri || BESS_MOTORS_MAPS_CID_URL,
    placeId,
    reviews: reviewsFromNewApi(data),
  };
}

type LegacyDetailsJson = {
  status?: string;
  error_message?: string;
  result?: {
    place_id?: string;
    name?: string;
    rating?: number;
    user_ratings_total?: number;
    url?: string;
    reviews?: {
      author_name?: string;
      rating?: number;
      text?: string;
      relative_time_description?: string;
      profile_photo_url?: string;
    }[];
  };
};

type LegacyFindJson = {
  status?: string;
  error_message?: string;
  candidates?: { place_id?: string }[];
};

function reviewsFromLegacy(data: LegacyDetailsJson): GooglePlaceReview[] {
  return (data.result?.reviews ?? [])
    .filter((r) => (r.text?.trim()?.length ?? 0) > 0)
    .map((r) => ({
      author: r.author_name?.trim() || "Google",
      rating: r.rating ?? 5,
      text: r.text?.trim() ?? "",
      relativeTime: r.relative_time_description ?? "",
      profilePhotoUrl: r.profile_photo_url,
    }))
    .slice(0, 8);
}

async function legacyPlaceDetails(
  key: string,
  params: Record<string, string>
): Promise<LegacyDetailsJson> {
  const qs = new URLSearchParams({
    key,
    language: params.language || "pl",
    fields: "place_id,name,rating,user_ratings_total,url,reviews",
    ...params,
  });
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${qs}`,
    { next: { revalidate: 21600 } }
  );
  return (await res.json()) as LegacyDetailsJson;
}

async function resolvePlaceIdViaLegacy(
  key: string
): Promise<{ id: string | null; denied: boolean; detail?: string }> {
  const configured = configuredPlaceId();
  if (configured) return { id: configured, denied: false };

  const qs = new URLSearchParams({
    key,
    input: SEARCH_QUERY,
    inputtype: "textquery",
    language: "pl",
    fields: "place_id",
  });
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?${qs}`,
    { next: { revalidate: 21600 } }
  );
  const data = (await res.json()) as LegacyFindJson;
  if (data.status && data.status !== "OK") {
    return {
      id: null,
      denied: data.status === "REQUEST_DENIED",
      detail: sanitizeDetail(
        `Places Legacy findplace ${data.status}: ${data.error_message || ""}`
      ),
    };
  }
  return { id: data.candidates?.[0]?.place_id ?? null, denied: false };
}

async function fetchViaPlacesLegacy(
  key: string,
  languageCode: string
): Promise<GooglePlaceReviewsPayload | null> {
  // 1) Direct Place ID
  let placeId = configuredPlaceId();

  // 2) Details by Maps CID (works with Places API Legacy when CID is known)
  if (!placeId) {
    const byCid = await legacyPlaceDetails(key, {
      cid: BESS_MOTORS_GOOGLE_CID,
      language: languageCode,
    });
    if (byCid.status === "OK" && byCid.result) {
      placeId = byCid.result.place_id ?? null;
      return {
        source: "google",
        status: "ok",
        placeName: byCid.result.name,
        rating: byCid.result.rating,
        userRatingCount: byCid.result.user_ratings_total,
        googleMapsUri: byCid.result.url || BESS_MOTORS_MAPS_CID_URL,
        placeId: placeId || undefined,
        reviews: reviewsFromLegacy(byCid),
      };
    }
    if (byCid.status === "REQUEST_DENIED") {
      // continue to findplace — same key may allow search but not cid
      console.warn(
        "[google-reviews] Legacy details by CID denied",
        byCid.error_message
      );
    }
  }

  const resolved = placeId
    ? { id: placeId, denied: false as boolean, detail: undefined as string | undefined }
    : await resolvePlaceIdViaLegacy(key);

  if (!resolved.id) {
    return {
      source: "unconfigured",
      status: resolved.denied ? "places_api_denied" : "place_not_found",
      detail: resolved.detail,
      reviews: [],
    };
  }

  const details = await legacyPlaceDetails(key, {
    place_id: resolved.id,
    language: languageCode,
  });

  if (details.status !== "OK" || !details.result) {
    return {
      source: "unconfigured",
      status: legacyStatusToOurs(details.status),
      detail: sanitizeDetail(
        `Places Legacy details ${details.status}: ${details.error_message || ""}`
      ),
      reviews: [],
    };
  }

  return {
    source: "google",
    status: "ok",
    placeName: details.result.name,
    rating: details.result.rating,
    userRatingCount: details.result.user_ratings_total,
    googleMapsUri: details.result.url || BESS_MOTORS_MAPS_CID_URL,
    placeId: details.result.place_id || resolved.id,
    reviews: reviewsFromLegacy(details),
  };
}

function isUsable(payload: GooglePlaceReviewsPayload): boolean {
  return payload.source === "google" && payload.status === "ok";
}

/**
 * Live Google reviews for the workshop profile.
 * Tries Places API (New), then Places API (Legacy) + CID lookup.
 */
export async function fetchGooglePlaceReviews(
  languageCode = "pl"
): Promise<GooglePlaceReviewsPayload> {
  const lang = languageCode.slice(0, 2) || "pl";
  const cached = cacheByLang.get(lang);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.data;
  }

  const key = apiKey();
  if (!key) {
    return { source: "unconfigured", status: "missing_api_key", reviews: [] };
  }

  try {
    const fromNew = await fetchViaPlacesNew(key, lang);
    if (fromNew && isUsable(fromNew) && fromNew.reviews.length > 0) {
      cacheByLang.set(lang, { at: Date.now(), data: fromNew });
      return fromNew;
    }

    // New API may return ok with empty reviews (field masked) — still try Legacy
    const fromLegacy = await fetchViaPlacesLegacy(key, lang);
    if (fromLegacy && isUsable(fromLegacy)) {
      cacheByLang.set(lang, { at: Date.now(), data: fromLegacy });
      return fromLegacy;
    }

    // Prefer New payload if it had rating even without review texts
    if (fromNew && isUsable(fromNew)) {
      cacheByLang.set(lang, { at: Date.now(), data: fromNew });
      return fromNew;
    }

    const failed: GooglePlaceReviewsPayload = fromLegacy ??
      fromNew ?? {
        source: "unconfigured",
        status: "places_api_error",
        reviews: [],
      };

    // Don't cache hard failures for long — allow quick recovery after key fix
    cacheByLang.set(lang, {
      at: Date.now() - CACHE_MS + 5 * 60 * 1000,
      data: failed,
    });
    return failed;
  } catch (e) {
    console.warn("[google-reviews] fetch failed", e);
    return {
      source: "unconfigured",
      status: "places_api_error",
      detail: sanitizeDetail(e instanceof Error ? e.message : "fetch failed"),
      reviews: [],
    };
  }
}

/** Lightweight probe for /api/health — uses shared cache when warm. */
export async function probeGooglePlacesConfigured(): Promise<{
  ok: boolean;
  hint: string;
  status?: GoogleReviewsStatus;
  detail?: string;
}> {
  const key = apiKey();
  if (!key) {
    return {
      ok: false,
      hint: "GOOGLE_PLACES_API_KEY missing — live Google reviews off",
      status: "missing_api_key",
    };
  }

  const payload = await fetchGooglePlaceReviews("pl");
  if (payload.source === "google" && payload.status === "ok") {
    const count = payload.userRatingCount ?? payload.reviews.length;
    return {
      ok: true,
      hint: `Google Places OK — ${payload.rating?.toFixed(1) ?? "?"}★ · ${count} reviews (live)`,
      status: "ok",
      detail: payload.placeId ? `place_id=${payload.placeId}` : undefined,
    };
  }

  const status = payload.status ?? "places_api_error";
  const fix =
    status === "places_api_denied"
      ? "Enable Places API (New) + Places API, use a server key without HTTP referrer restriction"
      : status === "place_not_found"
        ? "Set GOOGLE_PLACE_ID (ChIJ…) for BESS MOTORS"
        : "Check Google Cloud billing / Places API";

  return {
    ok: false,
    hint: `Google Places ${status} — ${fix}`,
    status,
    detail: payload.detail,
  };
}
