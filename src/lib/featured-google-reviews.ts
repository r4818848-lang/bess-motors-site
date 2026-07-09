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
  /** Review photos from Google Maps (if any) */
  photos?: string[];
};

const PLACE = "0x0:0x684ee899c310ad45";

function mapsReviewUrl(reviewId: string): string {
  return `https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1s${reviewId}!2m1!1s${PLACE}!3m1!1s2@1:CAIQACodChtycF9oOmJSNVBFRWNCSVF4aUtVWWpGVXdLZUE%7C%7C?hl=pl`;
}

/** Resize Google-hosted review photos for site display */
export function reviewPhotoDisplayUrl(url: string, width = 600): string {
  if (url.includes("=w") || url.includes("=s")) return url;
  return `${url}=w${width}-h${Math.round(width * 0.75)}-k-no`;
}

/**
 * Curated Google reviews — share links from Google Maps.
 * Text and photos synced from public Google listings.
 */
export const FEATURED_GOOGLE_REVIEWS: FeaturedGoogleReview[] = [
  {
    id: "gr-moore-rm",
    author: "Moore RM",
    rating: 5,
    text: "Ku mojemu zdziwieniu wyszło całkiem sprawnie i terminowo. Miałem do wymiany maglownicę oraz olej w skrzyni biegów. Od dnia oddania auta dostałem szczegółowy kosztorys, przy odbiorze gwarancja pisemna na wykonane usługi oraz paragon fiskalny (można również kartą zapłacić) — bez żadnych kaprysów i marudzenia. Warsztat niby garażowy a jednak trzyma poziom. Co do ceny — można sobie sprawdzić na zdjęciu (wdg. mnie zarąbiście). Zdecydowanie godny polecenia.",
    date: "09.07.2026",
    shareUrl: "https://maps.app.goo.gl/EWjHxWy8ysroUAgGA",
    mapsUrl: mapsReviewUrl(
      "Ci9DQUlRQUNvZENodHljRjlvT2tWMlQyaDZRbWRGTWpGS2VIZEJVRkZGV2sxeGNtYxAB"
    ),
    photos: [
      "https://lh3.googleusercontent.com/grass-cs/ANxoTn24ylTzETka71YTn3iZ2akbUhi_d0G61fuM0DOp9uOivT9w4UpGdjmbqdk2pMvcXFrOIpQCKxvetdQ2h1a3PfQGkd679m1rVjtQRCQr4sGsA6vqsRteqpUmMfnPDdt6oA3zvzJm9peAVuyf",
      "https://lh3.googleusercontent.com/grass-cs/ANxoTn1G77VfQ-bWQI3gEleQFUrvG3APdGsX3J_taB-dWc_XWNIuK0renxDCYV78vItEaMVJSg3bjuwQONPTKi8OAjssphw9EgiOdOHQ2QAhGp8HtuuUJFCiudB09ku_7PSQA-ykfqfSThOCyO-y",
      "https://lh3.googleusercontent.com/grass-cs/ANxoTn0qHRq3XFvtGYyEkM84cFVjIXRui3aF3pSat-NbUebeX-nYrTV6p4gkdYRFxBF-XcISghQBoEQN-rlzmre9ceTXF_L-oxPVBNoEIcSyHwCvYv-zdOUm48mNyNmwj_-C1FouQONquMc_cxqK",
      "https://lh3.googleusercontent.com/grass-cs/ANxoTn1UWlEVoR0icPG0hqTfkfFTDxbmC5oR4kKrmKj6oYo3HMgIS7Fl629SAqH7BevNWpIF27Ghlgay67Mewdk_pdVQD99GNTU-Pd-AbYaq8huqxud6HjuX-7TOZORFLLDQCnKpUhHWuFaANkoe",
    ],
  },
  {
    id: "gr-bartlomiej",
    author: "Bartłomiej Świsłocki",
    rating: 5,
    text: "Polecam!",
    date: "07.07.2026",
    shareUrl: "https://maps.app.goo.gl/GZi2JAfCvATFZSnt6",
    mapsUrl: mapsReviewUrl(
      "Ci9DQUlRQUNvZENodHljRjlvT25wWlRTMXpVak41ZFRRNWNqRmtXVWM0VDBkNk9GRRAB"
    ),
  },
  {
    id: "gr-jedrzej",
    author: "Jędrzej Orłowski",
    rating: 5,
    text: "Gdyby można dałbym 6 gwiazdek. Pomogli w zholowaniu uszkodzonego auta, wykonali dokumentację zdjęciową elementów kwalifikujących się do wymiany (zgodnie ze stanem faktycznym, bez naciągania) a następnie w cenie 60% wartości ofert innych warsztatów wymienili sprzęgło, tarcze, klocki. Do tego wymienili olej w skrzyni biegów + uszczelki, zaspawali nieszczelny wydech, uzupełnili płyny, w tym chłodnicy w cenie!! Wszystko szybko, sprawnie i cały czas informując o postępach prac. Dla mnie rewelacja — oby z czasem dorobili się lepszej widoczności na rynku, drogi dojazdowej, oznaczeń budynku, itp. bo zasługują na uwagę!",
    date: "25.06.2026",
    shareUrl: "https://maps.app.goo.gl/ieZuDj2DxLCUD8tS7",
    mapsUrl: mapsReviewUrl(
      "Ci9DQUlRQUNvZENodHljRjlvT21KU05WQkZSV05DU1ZGNGFVdFZXV3BHVlhkTFpVRRAB"
    ),
  },
  {
    id: "gr-anton",
    author: "Anton Tarkowskij",
    rating: 5,
    text: "Szybko naprawili moje BMW, jestem zadowolony",
    date: "25.06.2026",
    shareUrl: "https://maps.app.goo.gl/XdZWAjFwqoUUbSyN8",
    mapsUrl: mapsReviewUrl(
      "Ci9DQUlRQUNvZENodHljRjlvT21WM1QyTkpiMjFDWlc5cU5FaHhUREprUm1GTmJsRRAB"
    ),
    photos: [
      "https://lh3.googleusercontent.com/grass-cs/ANxoTn21nwzz6JWyzRpIxo67dZpDadBvTg1SyH_zLj3F1ZjxEP5u-6ZQ6415GIDHvHcADH4smSv86EqBdv1mPIKRPXOly45rRBj0YWL7DqIZ6zs_9eVEM0kdLBsWUl24lICfwQEvDkeZYEysy-E",
    ],
  },
  {
    id: "gr-dmitry",
    author: "Дмитрий Черняк",
    rating: 5,
    text: "Bardzo dobry serwis. Naprawa wykonana szybko i profesjonalnie. Polecam!",
    date: "25.06.2026",
    shareUrl: "https://maps.app.goo.gl/mc724gWMcaZk2YeZ7",
    mapsUrl: mapsReviewUrl(
      "Ci9DQUlRQUNvZENodHljRjlvT2tWU2RIQm9hRlp0ZW1WU2FtdFZjSGRJWW0xdGIxRRAB"
    ),
  },
  {
    id: "gr-alexey",
    author: "Алексей Курзов",
    rating: 5,
    text: "",
    date: "25.06.2026",
    shareUrl: "https://maps.app.goo.gl/CFLgqYqKeCWEYtSEA",
    mapsUrl: mapsReviewUrl(
      "Ci9DQUlRQUNvZENodHljRjlvT2xCRk5tRldVbUpTYVZOV1gyOUZPVFl4VldJeGVYYxAB"
    ),
  },
  {
    id: "gr-konstantin",
    author: "Константин",
    rating: 5,
    text: "Polecam tę usługę do obsługi mojego samochodu. Szybka naprawa za odpowiednie pieniądze.",
    date: "02.06.2026",
    shareUrl: "https://share.google/RqXC2bzV4Zof8kXlc",
    mapsUrl: "https://share.google/RqXC2bzV4Zof8kXlc",
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
];
