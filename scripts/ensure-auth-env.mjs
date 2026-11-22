#!/usr/bin/env node
/**
 * Upsert public Supabase Auth env + customer session secret on the VPS .env.
 * Safe to commit: URL + publishable anon key are public client values.
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const envPath = process.env.ENV_FILE || "/var/www/sisters-flowers/.env";

const UPDATES = {
  NEXT_PUBLIC_SUPABASE_URL: "https://vztzjqodazcolxfcljsf.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    "sb_publishable_K6M3oritixBYqPavJvyfjQ_dbSLyL5i",
  NEXT_PUBLIC_SITE_URL: "https://sistersflowers.vn",
  MAIL_PUBLIC_SITE_URL: "https://sistersflowers.vn",
};

function upsert(text, key, value) {
  const line = `${key}="${value}"`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(text)) return text.replace(re, line);
  const base = text.endsWith("\n") || text.length === 0 ? text : `${text}\n`;
  return `${base}${line}\n`;
}

/** Drop flags that force localhost into customer auth/email links. */
function stripLocalhostAuthFlags(text) {
  return text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return true;
      if (/^ALLOW_LOCALHOST_SITE_URL=/i.test(trimmed)) return false;
      return true;
    })
    .join("\n");
}

let text = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
text = stripLocalhostAuthFlags(text);
for (const [key, value] of Object.entries(UPDATES)) {
  text = upsert(text, key, value);
}

if (!/^CUSTOMER_SESSION_SECRET=/m.test(text)) {
  text = upsert(text, "CUSTOMER_SESSION_SECRET", randomBytes(32).toString("hex"));
}

writeFileSync(envPath, text, "utf8");
console.log(
  `ensure-auth-env: updated ${envPath} (site URL → sistersflowers.vn, stripped ALLOW_LOCALHOST_SITE_URL)`,
);
