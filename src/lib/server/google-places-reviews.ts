export type GooglePlaceReview = {
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
  profilePhotoUrl?: string;
};

export type GooglePlaceReviewsPayload = {
  source: "google" | "unconfigured";
  placeName?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews: GooglePlaceReview[];
};

const CACHE_MS = 6 * 60 * 60 * 1000;
let cache: { at: number; data: GooglePlaceReviewsPayload } | null = null;

function apiKey(): string | null {
  return (
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    null
  );
}

function placeId(): string | null {
  return (
    process.env.GOOGLE_PLACE_ID?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID?.trim() ||
    null
  );
}

async function resolvePlaceId(key: string): Promise<string | null> {
  const configured = placeId();
  if (configured) return configured;

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName",
    },
    body: JSON.stringify({
      textQuery: "BESS MOTORS serwis samochodowy Aleja Krakowska 48 Warszawa",
      languageCode: "pl",
      regionCode: "PL",
      maxResultCount: 1,
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    places?: { id?: string }[];
  };
  const id = data.places?.[0]?.id;
  return id?.replace(/^places\//, "") ?? id ?? null;
}

export async function fetchGooglePlaceReviews(
  languageCode = "pl"
): Promise<GooglePlaceReviewsPayload> {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return cache.data;
  }

  const key = apiKey();
  if (!key) {
    return { source: "unconfigured", reviews: [] };
  }

  try {
    const pid = await resolvePlaceId(key);
    if (!pid) {
      return { source: "unconfigured", reviews: [] };
    }

    const placeResource = pid.startsWith("places/") ? pid : `places/${pid}`;
    const res = await fetch(`https://places.googleapis.com/v1/${placeResource}`, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "displayName,rating,userRatingCount,googleMapsUri,reviews",
        "X-Goog-Language-Code": languageCode,
      },
      next: { revalidate: 21600 },
    });

    if (!res.ok) {
      console.warn("[google-reviews] Places API", res.status, await res.text());
      return { source: "unconfigured", reviews: [] };
    }

    const data = (await res.json()) as {
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
    };

    const reviews: GooglePlaceReview[] = (data.reviews ?? [])
      .filter((r) => (r.text?.text?.trim()?.length ?? 0) > 0)
      .map((r) => ({
        author: r.authorAttribution?.displayName?.trim() || "Google",
        rating: r.rating ?? 5,
        text: r.text?.text?.trim() ?? "",
        relativeTime: r.relativePublishTimeDescription ?? "",
        profilePhotoUrl: r.authorAttribution?.photoUri,
      }))
      .slice(0, 8);

    const payload: GooglePlaceReviewsPayload = {
      source: "google",
      placeName: data.displayName?.text,
      rating: data.rating,
      userRatingCount: data.userRatingCount,
      googleMapsUri: data.googleMapsUri,
      reviews,
    };

    cache = { at: Date.now(), data: payload };
    return payload;
  } catch (e) {
    console.warn("[google-reviews] fetch failed", e);
    return { source: "unconfigured", reviews: [] };
  }
}
