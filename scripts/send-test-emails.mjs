/**
 * Send branded SF sample emails via Zoho (info@ + orders@) and write HTML previews.
 *
 * Usage (from repo root):
 *   node --env-file=secrets/mail.env scripts/send-test-emails.mjs
 *
 * Optional:
 *   MAIL_PREVIEW_TO=a@x.com,b@y.com
 *   SEND_TO_MAILBOXES=1   # also deliver into info@ / orders@ inboxes
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";

/** Public https origin for logos/CTA — never localhost (email clients can't load it). */
const SITE = (
  process.env.MAIL_PUBLIC_SITE_URL ||
  (process.env.NEXT_PUBLIC_SITE_URL?.includes("localhost")
    ? ""
    : process.env.NEXT_PUBLIC_SITE_URL) ||
  "https://sistersflowers.vn"
).replace(/\/$/, "");
const TO = (process.env.MAIL_PREVIEW_TO || "felsendorff@gmail.com,butchi0603@gmail.com")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const FROM_INFO = process.env.MAIL_FROM_INFO || process.env.MAIL_FROM || "info@sistersflowers.vn";
const FROM_ORDERS =
  process.env.MAIL_FROM_ORDERS || "orders@sistersflowers.vn";
const FROM_NAME = process.env.MAIL_FROM_NAME || "Sisters Flowers";
const INCLUDE_MAILBOXES =
  process.env.SEND_TO_MAILBOXES === "1" ||
  process.env.SEND_TO_MAILBOXES === "true" ||
  process.env.SEND_TO_MAILBOXES === "yes";

const COLORS = {
  citrus: "#b0542c",
  forest: "#1a1714",
  cream: "#fff4eb",
  mist: "#f5ebe3",
  paper: "#ffffff",
  muted: "#6b635c",
  line: "#e8d9cc",
};

/** One shared Sisters Flowers transactional shell — logo, citrus bar, cream card. */
function layout(bodyHtml, preheader = "") {
  const logo = `${SITE}/brand/email-wordmark-stacked-black.png`;
  const year = new Date().getFullYear();
  const pre = preheader
    ? `<div style="display:none;font-size:1px;color:${COLORS.cream};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>`
    : "";
  return `<!DOCTYPE html>
<html lang="und">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Sisters Flowers</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.mist};font-family:Georgia,'Times New Roman',serif;color:${COLORS.forest};">
${pre}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.mist};padding:24px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${COLORS.paper};border-radius:16px;overflow:hidden;border:1px solid ${COLORS.line};">
        <tr>
          <td style="height:4px;background:${COLORS.citrus};font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td align="center" style="padding:28px 28px 8px;background:${COLORS.cream};">
            <a href="${SITE}/vi" style="text-decoration:none;">
              <img src="${logo}" width="168" alt="Sisters Flowers" style="display:block;border:0;outline:none;height:auto;max-width:168px;" />
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 28px 32px;background:${COLORS.paper};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:${COLORS.forest};">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px 24px;background:${COLORS.cream};border-top:1px solid ${COLORS.line};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${COLORS.muted};text-align:center;">
            © ${year} Sisters Flowers · <a href="${SITE}/vi" style="color:${COLORS.citrus};text-decoration:none;">sistersflowers.vn</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function btn(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
  <tr>
    <td style="border-radius:999px;background:${COLORS.citrus};">
      <a href="${href}" style="display:inline-block;padding:12px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">${label}</a>
    </td>
  </tr>
</table>`;
}

function detail(rows) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;">
${rows
  .map(
    ([k, v]) => `  <tr>
    <td style="padding:8px 0;border-bottom:1px solid ${COLORS.line};color:${COLORS.muted};width:38%;vertical-align:top;font-size:13px;">${k}</td>
    <td style="padding:8px 0;border-bottom:1px solid ${COLORS.line};vertical-align:top;font-size:14px;">${v}</td>
  </tr>`,
  )
  .join("\n")}
</table>`;
}

function heading(text) {
  return `<h1 style="margin:12px 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;font-weight:600;color:${COLORS.forest};">${text}</h1>`;
}

function muted(text) {
  return `<p style="margin:0 0 12px;color:${COLORS.muted};font-size:13px;">${text}</p>`;
}

const samples = [
  {
    key: "order-customer-vi",
    identity: "orders",
    subject: "Sisters Flowers — đã nhận đơn SF-TEST-VI",
    html: layout(
      [
        heading("Đã nhận đơn của bạn"),
        `<p style="margin:0 0 14px;">Xin chào — đây là email mẫu xác nhận đơn hàng từ <strong>orders@sistersflowers.vn</strong>.</p>`,
        muted("Studio sẽ xác nhận chi tiết và hướng dẫn thanh toán. Đây chưa phải biên lai."),
        detail([
          ["Ref", "<strong>SF-TEST-VI</strong>"],
          ["Giao đến", "Đà Lạt"],
          ["Tạm tính", "450.000 ₫"],
        ]),
        btn(`${SITE}/vi/shop`, "Xem cửa hàng"),
      ].join("\n"),
      "Mẫu xác nhận đơn VI · Sisters Flowers",
    ),
  },
  {
    key: "order-customer-en",
    identity: "orders",
    subject: "Sisters Flowers — order received SF-TEST-EN",
    html: layout(
      [
        heading("We received your order"),
        `<p style="margin:0 0 14px;">Hi — this is a sample order confirmation from <strong>orders@sistersflowers.vn</strong>.</p>`,
        muted("The studio will confirm details and arrange payment. This is not a receipt yet."),
        detail([
          ["Ref", "<strong>SF-TEST-EN</strong>"],
          ["Delivery", "Da Lat"],
          ["Subtotal", "450,000 ₫"],
        ]),
        btn(`${SITE}/en/shop`, "Browse the shop"),
      ].join("\n"),
      "Sample order confirmation EN · Sisters Flowers",
    ),
  },
  {
    key: "order-studio",
    identity: "orders",
    subject: "New order SF-TEST-STUDIO — Sample Guest",
    html: layout(
      [
        heading("New shop order"),
        `<p style="margin:0 0 14px;">Studio alert sample from the orders mailbox.</p>`,
        detail([
          ["Reference", "<strong>SF-TEST-STUDIO</strong>"],
          ["Customer", "Sample Guest"],
          ["Phone", "+84 90 000 0000"],
          ["Email", "guest@example.com"],
          ["Total", "450,000 ₫"],
        ]),
        btn(`${SITE}/admin/orders`, "Open admin orders"),
      ].join("\n"),
      "Studio order alert sample",
    ),
  },
  {
    key: "welcome-vi",
    identity: "info",
    subject: "Chào mừng đến Sisters Flowers",
    html: layout(
      [
        heading("Tài khoản đã sẵn sàng"),
        `<p style="margin:0 0 14px;">Xin chào — cảm ơn bạn đã tạo tài khoản Sisters Flowers. Email này gửi từ <strong>info@sistersflowers.vn</strong>.</p>`,
        muted("Dùng cùng một giao diện cho mọi thư giao dịch: logo, màu citrus, thẻ cream."),
        btn(`${SITE}/vi/account`, "Vào tài khoản"),
      ].join("\n"),
      "Chào mừng · Sisters Flowers",
    ),
  },
  {
    key: "inquiry-ack-en",
    identity: "info",
    subject: "We received your inquiry — Sisters Flowers",
    html: layout(
      [
        heading("Thank you for writing"),
        `<p style="margin:0 0 14px;">Hi — this is a sample inquiry reply from <strong>info@sistersflowers.vn</strong>. The studio will get back to you soon.</p>`,
        muted("Weddings, hotels, and custom bouquets use this same branded template."),
        btn(`${SITE}/en/shop`, "Browse the shop"),
      ].join("\n"),
      "Inquiry acknowledgement sample",
    ),
  },
];

function smtpFor(identity) {
  const host = process.env.SMTP_HOST || "smtp.zoho.com";
  const port = Number(process.env.SMTP_PORT || "465");
  const secure =
    process.env.SMTP_SECURE != null
      ? process.env.SMTP_SECURE === "1" || process.env.SMTP_SECURE === "true"
      : port === 465;

  if (identity === "orders") {
    const user =
      process.env.SMTP_USER_ORDERS ||
      process.env.MAIL_FROM_ORDERS ||
      process.env.SMTP_USER;
    const pass =
      process.env.SMTP_PASSWORD_ORDERS ||
      process.env.SMTP_PASS_ORDERS ||
      process.env.SMTP_PASSWORD ||
      process.env.SMTP_PASS;
    return { host, port, secure, user, pass, from: FROM_ORDERS };
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
  return { host, port, secure, user, pass, from: FROM_INFO };
}

function recipientsFor(identity) {
  const list = [...TO];
  if (INCLUDE_MAILBOXES) {
    const box = identity === "orders" ? FROM_ORDERS : FROM_INFO;
    if (box && !list.includes(box)) list.push(box);
  }
  return list;
}

async function main() {
  const outDir = path.join("artifacts", "email-previews");
  await mkdir(outDir, { recursive: true });
  for (const sample of samples) {
    await writeFile(path.join(outDir, `${sample.key}.html`), sample.html, "utf8");
  }
  console.log(`Wrote ${samples.length} HTML previews → ${outDir}`);

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
    console.log(`SMTP ready: ${identity} as ${cfg.user} → from ${cfg.from}`);
  }

  for (const sample of samples) {
    const cfg = smtpFor(sample.identity);
    const to = recipientsFor(sample.identity);
    const transporter = transporters.get(sample.identity);
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${cfg.from}>`,
      to,
      replyTo: FROM_INFO,
      subject: `[SF TEST] ${sample.subject}`,
      html: sample.html,
      text: sample.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    });
    console.log(
      `sent ${sample.key} via ${sample.identity} <${cfg.from}> → ${to.join(", ")} id=${info.messageId}`,
    );
  }

  console.log("Done. Check Gmail inboxes (and spam) for [SF TEST] messages.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
