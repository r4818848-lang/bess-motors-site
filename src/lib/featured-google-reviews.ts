export type FeaturedGoogleReview = {
  id: string;
  author: string;
  rating: number;
  text: string;
  /** DD.MM.YYYY for display */
  date: string;
  /** Short share link from Google Maps */
  shareUrl: string;
  /** Direct review permalink on Google Maps */
  mapsUrl: string;
};

/**
 * Curated Google reviews — share links from the business owner.
 * Text synced from public Google / DobryMechanik listings (same workshop).
 */
export const FEATURED_GOOGLE_REVIEWS: FeaturedGoogleReview[] = [
  {
    id: "gr-konstantin",
    author: "Константин",
    rating: 5,
    text: "Polecam tę usługę do obsługi mojego samochodu. Szybka naprawa za odpowiednie pieniądze.",
    date: "02.06.2026",
    shareUrl: "https://share.google/aQxH53ZogI7MT71J0",
    mapsUrl:
      "https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21KU05WQkZSV05DU1ZGNGFVdFZXV3BHVlhkTFpVRRAB!2m1!1s0x0:0x684ee899c310ad45!3m1!1s2@1:CAIQACodChtycF9oOmJSNVBFRWNCSVF4aUtVWWpGVXdLZUE%7C%7C?hl=pl",
  },
  {
    id: "gr-dmitry",
    author: "Дмитрий",
    rating: 5,
    text: "Bardzo dobry serwis. Naprawa wykonana szybko i profesjonalnie. Polecam!",
    date: "02.06.2026",
    shareUrl: "https://share.google/xwQ6VnFFvCzRZN3LJ",
    mapsUrl:
      "https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21WM1QyTkpiMjFDWlc5cU5FaHhUREprUm1GTmJsRRAB!2m1!1s0x0:0x684ee899c310ad45!3m1!1s2@1:CAIQACodChtycF9oOmV3T2NJb21CZW9qNEhxTDJkRmFNblE%7C%7C?hl=pl",
  },
  {
    id: "gr-ilya",
    author: "Ilya",
    rating: 5,
    text: "Obsługa 10/10",
    date: "02.06.2026",
    shareUrl: "https://share.google/W5AF1JDA3D3ANGDLo",
    mapsUrl:
      "https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25CQ1MwbGtOVWR2U25CaFVGOHdaREZPYWtSemRGRRAB!2m1!1s0x0:0x684ee899c310ad45!3m1!1s2@1:CAIQACodChtycF9oOnBCS0lkNUdvSnBhUF8wZDFOakRzdFE%7C%7C?hl=pl",
  },
  {
    id: "gr-alexey",
    author: "Алексей",
    rating: 5,
    text: "",
    date: "02.06.2026",
    shareUrl: "https://share.google/Sjd6EJ3dFUgfGGbRo",
    mapsUrl:
      "https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2tWU2RIQm9hRlp0ZW1WU2FtdFZjSGRJWW0xdGIxRRAB!2m1!1s0x0:0x684ee899c310ad45!3m1!1s2@1:CAIQACodChtycF9oOkVSdHBoaFZtemVSamtVcHdIYm1tb1E%7C%7C?hl=pl",
  },
];
