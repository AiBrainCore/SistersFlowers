#!/usr/bin/env node
/**
 * Optional helper: upsert Singapore Supabase URLs into the VPS .env.
 * Credentials must come from env (never hardcode secrets in git).
 *
 *   ENV_FILE=/var/www/sisters-flowers/.env \
 *   SF_DATABASE_URL='...' SF_DIRECT_URL='...' \
 *   SF_SUPABASE_URL='...' SF_SUPABASE_ANON_KEY='...' \
 *   node scripts/apply-singapore-db-env.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const envPath = process.env.ENV_FILE || "/var/www/sisters-flowers/.env";

const UPDATES = {
  DATABASE_URL: process.env.SF_DATABASE_URL,
  DIRECT_URL: process.env.SF_DIRECT_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.SF_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SF_SUPABASE_ANON_KEY,
};

for (const [key, value] of Object.entries(UPDATES)) {
  if (!value) {
    console.error(`Missing required env for ${key}`);
    process.exit(1);
  }
}

function upsert(text, key, value) {
  const line = `${key}="${value}"`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(text)) return text.replace(re, line);
  const base = text.endsWith("\n") || text.length === 0 ? text : `${text}\n`;
  return `${base}${line}\n`;
}

let text = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
for (const [key, value] of Object.entries(UPDATES)) {
  text = upsert(text, key, value);
}
writeFileSync(envPath, text, "utf8");
console.log(`apply-singapore-db-env: updated ${envPath}`);
