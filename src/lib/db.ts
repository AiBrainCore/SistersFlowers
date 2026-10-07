import { existsSync, copyFileSync, writeFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  sistersDbReady?: boolean;
};

/**
 * On Vercel the lambda FS is read-only except /tmp.
 * Copy the build-time SQLite file there so reads/writes work for demos.
 */
function prepareDatabaseUrl(): string {
  const configured = process.env.DATABASE_URL || "file:./dev.db";

  if (!process.env.VERCEL) {
    return configured;
  }

  const tmpDb = "/tmp/sisters-flowers.db";
  const readyMarker = "/tmp/sisters-flowers.ready";

  if (!globalForPrisma.sistersDbReady) {
    const bundled = path.join(process.cwd(), "prisma", "dev.db");
    if (!existsSync(tmpDb)) {
      if (existsSync(bundled)) {
        copyFileSync(bundled, tmpDb);
      }
    }
    try {
      writeFileSync(readyMarker, "1");
    } catch {
      // ignore marker failures
    }
    globalForPrisma.sistersDbReady = true;
  }

  return `file:${tmpDb}`;
}

const databaseUrl = prepareDatabaseUrl();
process.env.DATABASE_URL = databaseUrl;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
