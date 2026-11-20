#!/usr/bin/env node
/**
 * Upsert public site URL + Supabase service role into a .env file.
 * Secrets from AUTH_ENV_FILE or process env — never hardcode.
 *
 *   ENV_FILE=/var/www/sisters-flowers/.env \
 *   AUTH_ENV_FILE=/tmp/sf-auth.env \
 *   node scripts/apply-auth-env.mjs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const envPath = process.env.ENV_FILE || "/var/www/sisters-flowers/.env";
const authEnvPath = process.env.AUTH_ENV_FILE || "";

const KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "MAIL_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
];

function parseEnvFile(text) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function upsert(text, key, value) {
  const needsQuote = /[\s#"'$\\!]/.test(value);
  const line = needsQuote
    ? `${key}='${value.replace(/'/g, `'\\''`)}'`
    : `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(text)) return text.replace(re, line);
  const base = text.endsWith("\n") || text.length === 0 ? text : `${text}\n`;
  return `${base}${line}\n`;
}

const fromFile =
  authEnvPath && existsSync(authEnvPath)
    ? parseEnvFile(readFileSync(authEnvPath, "utf8"))
    : {};

/** @type {Record<string, string>} */
const updates = {
  NEXT_PUBLIC_SITE_URL: "https://sistersflowers.vn",
  MAIL_PUBLIC_SITE_URL: "https://sistersflowers.vn",
};

for (const key of KEYS) {
  const v = fromFile[key] ?? process.env[key];
  if (v != null && v !== "") updates[key] = v;
}

// Always force public origin on VPS apply.
updates.NEXT_PUBLIC_SITE_URL = "https://sistersflowers.vn";
updates.MAIL_PUBLIC_SITE_URL = "https://sistersflowers.vn";

if (!updates.SUPABASE_SERVICE_ROLE_KEY && !updates.SUPABASE_SECRET_KEY) {
  console.error(
    "apply-auth-env: need SUPABASE_SERVICE_ROLE_KEY (via AUTH_ENV_FILE or env)",
  );
  process.exit(1);
}

let text = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
for (const [key, value] of Object.entries(updates)) {
  text = upsert(text, key, value);
}
writeFileSync(envPath, text.endsWith("\n") ? text : `${text}\n`, "utf8");

const hasService = Boolean(
  updates.SUPABASE_SERVICE_ROLE_KEY || updates.SUPABASE_SECRET_KEY,
);
console.log(
  `apply-auth-env: updated ${envPath} (site=https://sistersflowers.vn, service_role=${hasService ? "set" : "missing"})`,
);
