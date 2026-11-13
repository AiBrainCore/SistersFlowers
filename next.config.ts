import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
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
