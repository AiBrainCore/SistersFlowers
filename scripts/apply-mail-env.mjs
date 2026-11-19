#!/usr/bin/env node
/**
 * Upsert P.A Vietnam / maychuemail SMTP keys into a .env file.
 * Secrets come from MAIL_ENV_FILE (or env vars) — never hardcode passwords in git.
 *
 *   ENV_FILE=/var/www/sisters-flowers/.env \
 *   MAIL_ENV_FILE=/tmp/sf-mail.env \
 *   EMAIL_ENABLED=true \
 *   node scripts/apply-mail-env.mjs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const envPath = process.env.ENV_FILE || "/var/www/sisters-flowers/.env";
const mailEnvPath = process.env.MAIL_ENV_FILE || "";

const KEYS = [
  "EMAIL_ENABLED",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_PASS",
  "MAIL_FROM",
  "MAIL_FROM_INFO",
  "MAIL_FROM_NAME",
  "MAIL_REPLY_TO",
  "MAIL_STUDIO_INBOX",
  "MAIL_FROM_ORDERS",
  "SMTP_USER_ORDERS",
  "SMTP_PASSWORD_ORDERS",
  "SMTP_PASS_ORDERS",
  "MAIL_PUBLIC_SITE_URL",
  "MAIL_PREVIEW_TO",
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
  const line = needsQuote ? `${key}='${value.replace(/'/g, `'\\''`)}'` : `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(text)) return text.replace(re, line);
  const base = text.endsWith("\n") || text.length === 0 ? text : `${text}\n`;
  return `${base}${line}\n`;
}

function stripZoho(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => {
      const t = line.trim();
      if (!t || t.startsWith("#")) return true;
      if (/smtp\.zoho\.com/i.test(t)) return false;
      if (/^SMTP_HOST=.*zoho/i.test(t)) return false;
      return true;
    })
    .join("\n");
}

/** @type {Record<string, string>} */
const fromFile = mailEnvPath && existsSync(mailEnvPath)
  ? parseEnvFile(readFileSync(mailEnvPath, "utf8"))
  : {};

/** @type {Record<string, string>} */
const updates = {};
for (const key of KEYS) {
  const v = process.env[key] ?? fromFile[key];
  if (v != null && v !== "") updates[key] = v;
}

if (process.env.EMAIL_ENABLED != null && process.env.EMAIL_ENABLED !== "") {
  updates.EMAIL_ENABLED = process.env.EMAIL_ENABLED;
}

if (!updates.SMTP_HOST || !updates.SMTP_USER || !(updates.SMTP_PASSWORD || updates.SMTP_PASS)) {
  console.error(
    "apply-mail-env: need SMTP_HOST, SMTP_USER, and SMTP_PASSWORD/SMTP_PASS (via MAIL_ENV_FILE or env)",
  );
  process.exit(1);
}

if (!updates.SMTP_PASSWORD && updates.SMTP_PASS) updates.SMTP_PASSWORD = updates.SMTP_PASS;
if (!updates.SMTP_PASS && updates.SMTP_PASSWORD) updates.SMTP_PASS = updates.SMTP_PASSWORD;
if (!updates.SMTP_PASSWORD_ORDERS && updates.SMTP_PASS_ORDERS) {
  updates.SMTP_PASSWORD_ORDERS = updates.SMTP_PASS_ORDERS;
}
if (!updates.SMTP_PASS_ORDERS && updates.SMTP_PASSWORD_ORDERS) {
  updates.SMTP_PASS_ORDERS = updates.SMTP_PASSWORD_ORDERS;
}

let text = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
text = stripZoho(text);
for (const [key, value] of Object.entries(updates)) {
  text = upsert(text, key, value);
}
writeFileSync(envPath, text.endsWith("\n") ? text : `${text}\n`, "utf8");

const enabled = updates.EMAIL_ENABLED ?? "(unchanged)";
console.log(`apply-mail-env: updated ${envPath} (EMAIL_ENABLED=${enabled}, host=${updates.SMTP_HOST})`);
