/**
 * Send branded SF sample emails via Zoho (info@ + orders@) using production mail builders.
 *
 * Usage:
 *   node --env-file=secrets/mail.env --import tsx scripts/send-test-emails.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";
import { pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

async function loadTs(rel) {
  const mod = await import(pathToFileURL(path.join(root, rel)).href);
  return mod;
}

const TO = (process.env.MAIL_PREVIEW_TO || "felsendorff@gmail.com,butchi0603@gmail.com")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const FROM_INFO = process.env.MAIL_FROM_INFO || process.env.MAIL_FROM || "info@sistersflowers.vn";
const FROM_ORDERS = process.env.MAIL_FROM_ORDERS || "orders@sistersflowers.vn";
const FROM_NAME = process.env.MAIL_FROM_NAME || "Sisters Flowers";

function smtpFor(identity) {
  const host = process.env.SMTP_HOST || "smtp.zoho.com";
  const port = Number(process.env.SMTP_PORT || "465");
  const secure =
    process.env.SMTP_SECURE != null
      ? process.env.SMTP_SECURE === "1" || process.env.SMTP_SECURE === "true"
      : port === 465;
  if (identity === "orders") {
    return {
      host,
      port,
      secure,
      user:
        process.env.SMTP_USER_ORDERS ||
        process.env.MAIL_FROM_ORDERS ||
        process.env.SMTP_USER,
      pass:
        process.env.SMTP_PASSWORD_ORDERS ||
        process.env.SMTP_PASS_ORDERS ||
        process.env.SMTP_PASSWORD ||
        process.env.SMTP_PASS,
      from: FROM_ORDERS,
    };
  }
  return {
    host,
    port,
    secure,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
    from: FROM_INFO,
  };
}

async function main() {
  const templates = await loadTs("src/lib/mail/templates.ts");
  const attachmentsMod = await loadTs("src/lib/mail/attachments.ts");
  const { mailInlineAttachments } = attachmentsMod;
  const {
    buildOrderCustomerEmail,
    buildOrderStudioEmail,
    buildWelcomeEmail,
    buildInquiryAckEmail,
  } = templates;

  const sampleItems = [
    { name: "Celebration garden", qty: 1, price: 450000 },
  ];

  const samples = [
    {
      key: "order-customer-vi-dalat",
      identity: "orders",
      citySlug: "dalat",
      build: () =>
        buildOrderCustomerEmail({
          locale: "vi",
          reference: "SF-TEST-DALAT",
          customerName: "Anh/Chị",
          phone: "+84 90 000 0000",
          email: TO[0],
          address: "04 Chi Lăng, P.9",
          citySlug: "dalat",
          subtotal: 450000,
          deliveryFee: 0,
          deliveryTotal: 450000,
          items: sampleItems,
        }),
    },
    {
      key: "order-customer-en-danang",
      identity: "orders",
      citySlug: "danang",
      build: () =>
        buildOrderCustomerEmail({
          locale: "en",
          reference: "SF-TEST-DANANG",
          customerName: "Guest",
          phone: "+84 90 000 0000",
          email: TO[0],
          address: "53 Luong Nhu Hoc",
          citySlug: "danang",
          subtotal: 450000,
          deliveryFee: 30000,
          deliveryTotal: 480000,
          items: sampleItems,
        }),
    },
    {
      key: "order-studio-dalat",
      identity: "orders",
      citySlug: "dalat",
      build: () =>
        buildOrderStudioEmail({
          locale: "en",
          reference: "SF-TEST-STUDIO-DALAT",
          customerName: "Sample Guest",
          phone: "+84 90 000 0000",
          email: "guest@example.com",
          address: "Da Lat hotel",
          citySlug: "dalat",
          subtotal: 450000,
          deliveryFee: 0,
          deliveryTotal: 450000,
          items: sampleItems,
        }),
    },
    {
      key: "welcome-vi",
      identity: "info",
      citySlug: null,
      build: () => buildWelcomeEmail("vi", "Anh/Chị", TO[0]),
    },
    {
      key: "inquiry-ack-en-danang",
      identity: "info",
      citySlug: "danang",
      build: () =>
        buildInquiryAckEmail({
          locale: "en",
          variant: "wedding",
          name: "Guest",
          email: TO[0],
          message: "Sample wedding inquiry",
          citySlug: "danang",
        }),
    },
  ];

  const outDir = path.join(root, "artifacts", "email-previews");
  await mkdir(outDir, { recursive: true });

  const transporters = new Map();
  for (const identity of ["info", "orders"]) {
    const cfg = smtpFor(identity);
    if (!cfg.user || !cfg.pass) {
      console.error(`Missing SMTP credentials for ${identity}`);
      process.exitCode = 2;
      return;
    }
    transporters.set(
      identity,
      nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: { user: cfg.user, pass: cfg.pass },
        connectionTimeout: 20000,
        socketTimeout: 30000,
      }),
    );
    console.log(`SMTP ready: ${identity} as ${cfg.user}`);
  }

  for (const sample of samples) {
    const mail = sample.build();
    // Previews use https URLs (no CID) so opening HTML files works offline.
    const previewHtml = mail.html.replace(/cid:sf-wordmark/g, "https://sistersflowers.vn/brand/email-wordmark-black.png")
      .replace(/cid:sf-social-instagram/g, "https://sistersflowers.vn/brand/social/instagram.png")
      .replace(/cid:sf-social-facebook/g, "https://sistersflowers.vn/brand/social/facebook.png")
      .replace(/cid:sf-social-whatsapp/g, "https://sistersflowers.vn/brand/social/whatsapp.png")
      .replace(/cid:sf-social-zalo/g, "https://sistersflowers.vn/brand/social/zalo.png");
    // Rebuild preview without CID for local artifact viewing
    await writeFile(path.join(outDir, `${sample.key}.html`), previewHtml, "utf8");

    const cfg = smtpFor(sample.identity);
    const transporter = transporters.get(sample.identity);
    const attachments = mailInlineAttachments(sample.citySlug, root);
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${cfg.from}>`,
      to: TO,
      replyTo: FROM_INFO,
      subject: `[SF TEST] ${mail.subject}`,
      html: mail.html,
      text: mail.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      attachments,
    });
    console.log(
      `sent ${sample.key} via ${sample.identity} <${cfg.from}> → ${TO.join(", ")} id=${info.messageId}`,
    );
  }

  console.log("Done. Check inboxes for [SF TEST] with city tags + unsubscribe footer.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
