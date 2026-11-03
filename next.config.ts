import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Keep Prisma schema + SQLite assets available in the Node server bundle (Hostinger).
  outputFileTracingIncludes: {
    "/**": ["./prisma/**/*"],
  },
};

export default nextConfig;
