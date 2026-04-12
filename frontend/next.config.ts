import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "http",  hostname: "127.0.0.1" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
