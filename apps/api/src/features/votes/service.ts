import { and, desc, eq } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import { pollOptions, polls, votes } from "../../db/schema.js";
import { HttpError } from "../../shared/errors.js";

type VoteReader = Pick<Database, "select">;

/**
 * The vote fields a caller may see. The idempotency key and the denormalised
 * voter_unique flag are internal bookkeeping, so they never leave the API.
 */
const voteDto = {
  id: votes.id,
  pollId: votes.pollId,
  optionId: votes.optionId,
  voterId: votes.voterId,
  createdAt: votes.createdAt,
};

export type EligibilityBlockCode =
  | "POLL_NOT_OPEN"
  | "POLL_NOT_STARTED"
  | "POLL_CLOSED"
  | "AUTHENTICATION_REQUIRED"
  | "PAYMENT_REQUIRED"
  | "ALREADY_VOTED";

export type EligibilityResult =
  | {
      eligible: true;
      pollId: string;
      pollType: string;
      votingPolicy: "open" | "account_limited";
      requiresPayment: boolean;
      voterPriceMinor: number | null;
      currency: string;
    }
  | { eligible: false; code: EligibilityBlockCode; message: string };

/**
 * Decide whether a vote would be accepted. A missing or removed poll and an
 * option that belongs to a different poll are client/programming errors and
 * still throw; every expected "you may not vote" outcome is returned so callers
 * can explain it instead of guessing from the frontend.
 */
export async function evaluateEligibility(
  db: VoteReader,
  input: { pollId: string; optionId?: string; voterId?: string },
): Promise<EligibilityResult> {
  const [poll] = await db
    .select()
    .from(polls)
    .where(eq(polls.id, input.pollId))
    .limit(1);
  if (!poll || poll.status === "removed")
    throw new HttpError(404, "POLL_NOT_FOUND", "Poll not found");

  if (input.optionId) {
    const [option] = await db
      .select({ id: pollOptions.id })
      .from(pollOptions)
      .where(
        and(
          eq(pollOptions.id, input.optionId),
          eq(pollOptions.pollId, input.pollId),
        ),
      )
      .limit(1);
    if (!option)
      throw new HttpError(
        400,
        "INVALID_OPTION",
        "That option does not belong to this poll",
      );
  }

  if (poll.status !== "published")
    return {
      eligible: false,
      code: "POLL_NOT_OPEN",
      message: "This poll is not accepting votes",
    };

  const now = new Date();
  if (poll.startsAt && poll.startsAt > now)
    return {
      eligible: false,
      code: "POLL_NOT_STARTED",
      message: "This poll has not started yet",
    };
  if (poll.endsAt && poll.endsAt <= now)
    return {
      eligible: false,
      code: "POLL_CLOSED",
      message: "This poll has ended",
    };

  if (poll.votingPolicy === "account_limited" && !input.voterId)
    return {
      eligible: false,
      code: "AUTHENTICATION_REQUIRED",
      message: "Sign in is required to vote in this poll",
    };

  if (poll.votingPolicy === "account_limited" && input.voterId) {
    const [existing] = await db
      .select({ id: votes.id })
      .from(votes)
      .where(
        and(eq(votes.pollId, input.pollId), eq(votes.voterId, input.voterId)),
      )
      .limit(1);
    if (existing)
      return {
        eligible: false,
        code: "ALREADY_VOTED",
        message: "This account has already voted in this poll",
      };
  }

  if (poll.voterPriceMinor !== null)
    return {
      eligible: false,
      code: "PAYMENT_REQUIRED",
      message:
        "This poll requires a voter payment; payment processing is not enabled yet",
    };

  return {
    eligible: true,
    pollId: poll.id,
    pollType: poll.pollType,
    votingPolicy: poll.votingPolicy,
    requiresPayment: poll.voterPriceMinor !== null,
    voterPriceMinor: poll.voterPriceMinor,
    currency: poll.currency,
  };
}

/** Throwing form of {@link evaluateEligibility} used before writing a vote. */
export async function checkEligibility(
  db: VoteReader,
  input: { pollId: string; optionId?: string; voterId?: string },
) {
  const result = await evaluateEligibility(db, input);
  if (!result.eligible) {
    const status =
      result.code === "AUTHENTICATION_REQUIRED"
        ? 401
        : result.code === "PAYMENT_REQUIRED"
          ? 402
          : 409;
    throw new HttpError(status, result.code, result.message);
  }
  return result;
}

export async function castVote(
  db: Database,
  input: {
    pollId: string;
    optionId: string;
    voterId?: string;
    idempotencyKey: string;
  },
) {
  const [existing] = await db
    .select(voteDto)
    .from(votes)
    .where(
      and(
        eq(votes.pollId, input.pollId),
        eq(votes.idempotencyKey, input.idempotencyKey),
      ),
    )
    .limit(1);
  if (existing) {
    if (
      existing.optionId !== input.optionId ||
      existing.voterId !== (input.voterId ?? null)
    ) {
      throw new HttpError(
        409,
        "IDEMPOTENCY_KEY_REUSED",
        "This key was already used for a different vote",
      );
    }
    return { vote: existing, replayed: true };
  }
  try {
    return await db.transaction(async (tx) => {
      const eligibility = await checkEligibility(tx, input);
      const [vote] = await tx
        .insert(votes)
        .values({
          pollId: input.pollId,
          optionId: input.optionId,
          voterId: input.voterId ?? null,
          idempotencyKey: input.idempotencyKey,
          // Open polls allow repeat voting, so only account-limited polls write
          // rows the votes_poll_voter_unique index will police.
          voterUnique: eligibility.votingPolicy === "account_limited",
        })
        .returning(voteDto);
      return { vote, replayed: false };
    });
  } catch (error) {
    // An ineligible voter already produced a precise HttpError; let it through.
    if (error instanceof HttpError) throw error;
    // Only a unique violation can mean "this was a replay" or "already voted".
    // Anything else (lost connection, unexpected constraint) surfaces as-is.
    if ((error as { code?: unknown } | null)?.code !== "23505") throw error;
    const [idempotentVote] = await db
      .select(voteDto)
      .from(votes)
      .where(
        and(
          eq(votes.pollId, input.pollId),
          eq(votes.idempotencyKey, input.idempotencyKey),
        ),
      )
      .limit(1);
    if (idempotentVote) {
      if (
        idempotentVote.optionId !== input.optionId ||
        idempotentVote.voterId !== (input.voterId ?? null)
      ) {
        throw new HttpError(
          409,
          "IDEMPOTENCY_KEY_REUSED",
          "This key was already used for a different vote",
        );
      }
      return { vote: idempotentVote, replayed: true };
    }
    if (input.voterId) {
      const [existingVote] = await db
        .select({ id: votes.id })
        .from(votes)
        .where(
          and(eq(votes.pollId, input.pollId), eq(votes.voterId, input.voterId)),
        )
        .limit(1);
      if (existingVote)
        throw new HttpError(
          409,
          "ALREADY_VOTED",
          "This account has already voted in this poll",
        );
    }
    throw error;
  }
}

/** The most recent vote this account cast in the poll, if any. */
export async function getMyVote(db: Database, pollId: string, voterId: string) {
  const [vote] = await db
    .select(voteDto)
    .from(votes)
    .where(and(eq(votes.pollId, pollId), eq(votes.voterId, voterId)))
    .orderBy(desc(votes.createdAt))
    .limit(1);
  return vote ?? null;
}
