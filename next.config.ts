import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pdf-parse", "tesseract.js"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/thank-you", destination: "/booking/thank-you", permanent: true },
      { source: "/kontakt", destination: "/contacts", permanent: true },
      { source: "/contact", destination: "/contacts", permanent: true },
      { source: "/kontakty", destination: "/contacts", permanent: true },
      { source: "/klocki-hamulcowe", destination: "/hamulce", permanent: true },
      { source: "/serwis-klimatyzacji", destination: "/klimatyzacja", permanent: true },
      { source: "/wulkanizacja", destination: "/opony", permanent: true },
      { source: "/wulkanizacja-warszawa", destination: "/opony", permanent: true },
      { source: "/chip-tuning", destination: "/chip-tuning-warszawa", permanent: true },
      { source: "/tuning", destination: "/chip-tuning-warszawa", permanent: true },
      { source: "/serwis-samochodowy", destination: "/", permanent: true },
      { source: "/warsztat-samochodowy", destination: "/", permanent: true },
      { source: "/mechanik-warszawa", destination: "/warszawa-wlochy", permanent: true },
      { source: "/cennik-uslug", destination: "/cennik", permanent: true },
      { source: "/zapis-online", destination: "/booking", permanent: true },
    ];
  },
};

export default nextConfig;
