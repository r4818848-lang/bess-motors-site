import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.imagin.studio",
        pathname: "/getImage**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/thank-you", destination: "/booking/thank-you", permanent: true },
    ];
  },
};

export default nextConfig;
