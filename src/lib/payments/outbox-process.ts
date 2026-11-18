import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail/send";
import { markOutboxAttempt } from "@/lib/payments/outbox";

/**
 * Process pending notification outbox rows.
 * Safe for cron / serverless: bounded batch, no in-memory worker required.
 */
export async function processNotificationOutbox(limit = 20) {
  const pending = await prisma.notificationOutbox.findMany({
    where: { status: { in: ["pending", "failed"] }, attempts: { lt: 5 } },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let sent = 0;
  let failed = 0;

  for (const row of pending) {
    try {
      const payload = JSON.parse(row.payload) as {
        subject?: string;
        html?: string;
        from?: "info" | "orders";
        citySlug?: string | null;
      };
      if (!payload.subject || !payload.html) {
        await markOutboxAttempt(row.dedupeKey, {
          ok: false,
          error: "invalid_payload",
        });
        failed += 1;
        continue;
      }
      const result = await sendMail({
        to: row.recipient,
        from: payload.from || "orders",
        subject: payload.subject,
        html: payload.html,
        citySlug: payload.citySlug,
        transactional: true,
        eventKey: row.dedupeKey,
        relatedType: "outbox",
        relatedId: row.id,
      });
      const ok = result.ok;
      await markOutboxAttempt(row.dedupeKey, {
        ok,
        error: ok ? undefined : ("error" in result ? result.error : "send_failed"),
      });
      if (ok) sent += 1;
      else failed += 1;
    } catch (error) {
      await markOutboxAttempt(row.dedupeKey, {
        ok: false,
        error: error instanceof Error ? error.message : "exception",
      });
      failed += 1;
    }
  }

  return { processed: pending.length, sent, failed };
}
