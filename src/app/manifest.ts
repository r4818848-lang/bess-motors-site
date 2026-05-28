import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BESS MOTORS — Serwis samochodowy",
    short_name: "BESS MOTORS",
    description: "Serwis samochodowy Warszawa — zapis online i konto klienta",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#e10600",
    lang: "pl",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
