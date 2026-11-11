#!/usr/bin/env node
/**
 * One-shot production helper: upsert Singapore Supabase URLs into the VPS .env.
 * Called from deploy-production.sh. Repo is private; rotate DB password after cutover
 * and delete the credential literals from this file.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const envPath = process.env.ENV_FILE || "/var/www/sisters-flowers/.env";

const UPDATES = {
  DATABASE_URL:
    "postgresql://postgres.vztzjqodazcolxfcljsf:h9S4pHQpN%23UkSM2@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1",
  DIRECT_URL:
    "postgresql://postgres.vztzjqodazcolxfcljsf:h9S4pHQpN%23UkSM2@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require",
  NEXT_PUBLIC_SUPABASE_URL: "https://vztzjqodazcolxfcljsf.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_K6M3oritixBYqPavJvyfjQ_dbSLyL5i",
};

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
