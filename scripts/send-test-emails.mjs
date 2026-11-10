/**
 * Send branded SF sample emails to owner inboxes (and write HTML previews).
 *
 * Usage (from repo root, with SMTP in env / secrets/mail.env):
 *   node --env-file=secrets/mail.env --env-file=.env.local scripts/send-test-emails.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://sistersflowers.vn").replace(
  /\/$/,
  "",
);
const TO = (process.env.MAIL_PREVIEW_TO || "felsendorff@gmail.com,butchi0603@gmail.com")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const FROM_ORDERS = process.env.MAIL_FROM_ORDERS || "orders@sistersflowers.vn";
const FROM_INFO = process.env.MAIL_FROM_INFO || "info@sistersflowers.vn";

const COLORS = {
  citrus: "#b0542c",
  forest: "#1a1714",
  cream: "#fff4eb",
  mist: "#f5ebe3",
  paper: "#ffffff",
  muted: "#6b635c",
  line: "#e8d9cc",
};

function layout(bodyHtml, preheader = "") {
  const logo = `${SITE}/brand/email-wordmark-stacked-black.png`;
  const pre = preheader
    ? `<div style="display:none;font-size:1px;color:${COLORS.cream};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>`
    : "";
  return `<!DOCTYPE html><html><body style="margin:0;background:${COLORS.mist};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${COLORS.forest};">
${pre}
<table width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.mist};padding:24px 12px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${COLORS.paper};border-radius:16px;overflow:hidden;border:1px solid ${COLORS.line};">
<tr><td style="height:4px;background:${COLORS.citrus};">&nbsp;</td></tr>
<tr><td align="center" style="padding:28px;background:${COLORS.cream};"><img src="${logo}" width="168" alt="Sisters Flowers" style="display:block;border:0;max-width:168px;height:auto;" /></td></tr>
<tr><td style="padding:8px 28px 32px;">${bodyHtml}</td></tr>
<tr><td style="padding:18px 28px 24px;background:${COLORS.cream};border-top:1px solid ${COLORS.line};font-size:12px;color:${COLORS.muted};text-align:center;">© Sisters Flowers · sistersflowers.vn</td></tr>
</table></td></tr></table></body></html>`;
}

function btn(href, label) {
  return `<a href="${href}" style="display:inline-block;margin:20px 0;padding:12px 22px;background:${COLORS.citrus};color:#fff;text-decoration:none;border-radius:999px;font-weight:600;font-size:14px;">${label}</a>`;
}

const samples = [
  {
    key: "order-customer-vi",
    from: FROM_ORDERS,
    subject: "Sisters Flowers — đã nhận đơn SF-TEST-VI",
    html: layout(
      `<h1 style="font-family:Georgia,serif;font-size:24px;">Đã nhận đơn của bạn</h1>
       <p>Xin chào, đây là email mẫu xác nhận đơn hàng (VI).</p>
       <p style="color:${COLORS.muted};font-size:13px;">Studio sẽ xác nhận và hướng dẫn thanh toán. Đây chưa phải biên lai.</p>
       <p><strong>Ref:</strong> SF-TEST-VI<br/><strong>Tạm tính:</strong> 450.000 ₫</p>
       ${btn(`${SITE}/vi/shop`, "Xem cửa hàng")}`,
      "Mẫu xác nhận đơn VI",
    ),
  },
  {
    key: "order-customer-en",
    from: FROM_ORDERS,
    subject: "Sisters Flowers — order received SF-TEST-EN",
    html: layout(
      `<h1 style="font-family:Georgia,serif;font-size:24px;">We received your order</h1>
       <p>Hi, this is a sample order confirmation (EN).</p>
       <p style="color:${COLORS.muted};font-size:13px;">The studio will confirm details and arrange payment. This is not a receipt yet.</p>
       <p><strong>Ref:</strong> SF-TEST-EN<br/><strong>Subtotal:</strong> 450,000 ₫</p>
       ${btn(`${SITE}/en/shop`, "Browse the shop")}`,
      "Sample order confirmation EN",
    ),
  },
  {
    key: "order-studio",
    from: FROM_ORDERS,
    subject: "New order SF-TEST-STUDIO — Sample Guest",
    html: layout(
      `<h1 style="font-family:Georgia,serif;font-size:24px;">New shop order</h1>
       <p>Customer: Sample Guest<br/>Phone: +84 90 000 0000<br/>Email: guest@example.com<br/>Total: 450,000 ₫</p>
       ${btn(`${SITE}/admin/orders`, "Open admin orders")}`,
      "Studio alert sample",
    ),
  },
  {
    key: "welcome-vi",
    from: FROM_INFO,
    subject: "Chào mừng đến Sisters Flowers",
    html: layout(
      `<h1 style="font-family:Georgia,serif;font-size:24px;">Tài khoản đã sẵn sàng</h1>
       <p>Xin chào, cảm ơn bạn đã tạo tài khoản Sisters Flowers.</p>
       ${btn(`${SITE}/vi/account`, "Vào tài khoản")}`,
      "Welcome VI",
    ),
  },
];

async function main() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || "465");
  const secure =
    process.env.SMTP_SECURE != null
      ? process.env.SMTP_SECURE === "1" || process.env.SMTP_SECURE === "true"
      : port === 465;

  const outDir = path.join("artifacts", "email-previews");
  await mkdir(outDir, { recursive: true });
  for (const sample of samples) {
    await writeFile(path.join(outDir, `${sample.key}.html`), sample.html, "utf8");
  }
  console.log(`Wrote ${samples.length} HTML previews → ${outDir}`);

  if (!host || !user || !pass) {
    console.error("SMTP_HOST / SMTP_USER / SMTP_PASS missing — previews only, no send.");
    process.exitCode = 2;
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  for (const sample of samples) {
    const info = await transporter.sendMail({
      from: `"Sisters Flowers" <${sample.from}>`,
      to: TO,
      subject: `[SF TEST] ${sample.subject}`,
      html: sample.html,
    });
    console.log(`sent ${sample.key} → ${TO.join(", ")} id=${info.messageId}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
