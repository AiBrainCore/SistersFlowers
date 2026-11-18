import { prisma } from "@/lib/db";

/** Enqueue a durable notification row (deduped). Does not send. */
export async function enqueueNotification(input: {
  dedupeKey: string;
  channel?: string;
  template: string;
  recipient: string;
  payload: Record<string, unknown>;
}) {
  try {
    await prisma.notificationOutbox.upsert({
      where: { dedupeKey: input.dedupeKey },
      create: {
        dedupeKey: input.dedupeKey,
        channel: input.channel || "email",
        template: input.template,
        recipient: input.recipient,
        payload: JSON.stringify(input.payload),
        status: "pending",
      },
      update: {},
    });
  } catch (error) {
    console.error("[outbox] enqueue failed", error);
  }
}

/** Mark outbox row sent / failed after an attempt. */
export async function markOutboxAttempt(
  dedupeKey: string,
  result: { ok: boolean; error?: string },
) {
  try {
    const row = await prisma.notificationOutbox.findUnique({
      where: { dedupeKey },
    });
    if (!row) return;
    await prisma.notificationOutbox.update({
      where: { id: row.id },
      data: {
        attempts: { increment: 1 },
        status: result.ok ? "sent" : "failed",
        lastError: result.ok ? null : result.error || "send_failed",
        sentAt: result.ok ? new Date() : row.sentAt,
      },
    });
  } catch (error) {
    console.error("[outbox] mark failed", error);
  }
}
