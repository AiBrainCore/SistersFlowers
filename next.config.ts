import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve responsive WebP/AVIF via /_next/image — PageSpeed was serving
    // multi‑MB originals because unoptimized bypassed all resizing.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1600],
    imageSizes: [48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "vztzjqodazcolxfcljsf.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Hostinger Node plans hit OS thread limits with default "N CPU" static workers.
  // Keep generation sequential/low-concurrency so `next build` does not SIGABRT.
  experimental: {
    cpus: 1,
    workerThreads: false,
    staticGenerationMaxConcurrency: 2,
    staticGenerationMinPagesPerWorker: 50,
  },
  // Keep Prisma schema + SQLite assets available in the Node server bundle (Hostinger).
  outputFileTracingIncludes: {
    "/**": ["./prisma/**/*"],
  },
};

export default nextConfig;
