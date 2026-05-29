import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
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
    ];
  },
};

export default nextConfig;
