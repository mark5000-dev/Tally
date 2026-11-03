import { and, desc, eq } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import { ledgerEntries, payments, polls } from "../../db/schema.js";
import { HttpError } from "../../shared/errors.js";
import { calculateChargeAmount } from "./pricing.js";

export async function createPaymentIntent(
  db: Database,
  input: {
    userId: string;
    pollId: string;
    purpose: "creator_poll_type" | "voter_poll";
    idempotencyKey: string;
  },
) {
  const [poll] = await db
    .select()
    .from(polls)
    .where(eq(polls.id, input.pollId))
    .limit(1);
  if (!poll || poll.status === "removed")
    throw new HttpError(404, "POLL_NOT_FOUND", "Poll not found");
  if (
    input.purpose === "creator_poll_type" &&
    poll.creatorId !== input.userId
  ) {
    throw new HttpError(
      403,
      "POLL_OWNER_REQUIRED",
      "Only the poll creator can pay its poll-type charge",
    );
  }
  const amountMinor = calculateChargeAmount(poll, input.purpose);
  if (input.purpose === "voter_poll" && poll.status !== "published") {
    throw new HttpError(
      409,
      "POLL_NOT_OPEN",
      "Voter payments are accepted only for a published poll",
    );
  }

  const [existing] = await db
    .select()
    .from(payments)
    .where(eq(payments.idempotencyKey, input.idempotencyKey))
    .limit(1);
  if (existing) {
    if (
      existing.userId !== input.userId ||
      existing.pollId !== input.pollId ||
      existing.purpose !== input.purpose ||
      existing.amountMinor !== amountMinor
    ) {
      throw new HttpError(
        409,
        "IDEMPOTENCY_KEY_REUSED",
        "This idempotency key was used for a different payment",
      );
    }
    return { payment: existing, replayed: true, providerEnabled: false };
  }

  const [payment] = await db
    .insert(payments)
    .values({
      pollId: input.pollId,
      userId: input.userId,
      amountMinor,
      currency: poll.currency,
      purpose: input.purpose,
      idempotencyKey: input.idempotencyKey,
      provider: "not_configured",
      status: "created",
      metadata: { providerEnabled: false },
    })
    .returning();
  return { payment, replayed: false, providerEnabled: false };
}

export async function getPayment(
  db: Database,
  paymentId: string,
  userId: string,
) {
  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.userId, userId)))
    .limit(1);
  if (!payment)
    throw new HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
  return payment;
}

export async function listPaymentIntents(db: Database, userId: string) {
  return db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt))
    .limit(100);
}

export async function listLedger(
  db: Database,
  userId: string,
  page: number,
  limit: number,
) {
  const data = await db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.ownerUserId, userId))
    .orderBy(desc(ledgerEntries.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
  return { data, pagination: { page, limit } };
}
