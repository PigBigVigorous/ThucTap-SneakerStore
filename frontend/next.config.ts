import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // unoptimized: true — ảnh load thẳng từ URL gốc (không qua /_next/image),
    // tránh lỗi "resolved to private ip" khi backend chạy trên 127.0.0.1:8000
    unoptimized: true,
  },
  allowedDevOrigins: ["sneaker-store.akg.vn", "sneaker-store.com"],
};

export default nextConfig;
