import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      { source: "/thank-you", destination: "/booking/thank-you", permanent: true },
    ];
  },
};

export default nextConfig;
