import { and, eq } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import { pollOptions, polls, votes } from "../../db/schema.js";
import { HttpError } from "../../shared/errors.js";

type VoteReader = Pick<Database, "select">;

export async function checkEligibility(
  db: VoteReader,
  input: { pollId: string; optionId?: string; voterId?: string },
) {
  const [poll] = await db
    .select()
    .from(polls)
    .where(eq(polls.id, input.pollId))
    .limit(1);
  if (!poll || poll.status === "removed")
    throw new HttpError(404, "POLL_NOT_FOUND", "Poll not found");
  if (poll.status !== "published")
    throw new HttpError(
      409,
      "POLL_NOT_OPEN",
      "This poll is not accepting votes",
    );
  const now = new Date();
  if (poll.startsAt && poll.startsAt > now)
    throw new HttpError(
      409,
      "POLL_NOT_STARTED",
      "This poll has not started yet",
    );
  if (poll.endsAt && poll.endsAt <= now)
    throw new HttpError(409, "POLL_CLOSED", "This poll has ended");
  if (poll.votingPolicy === "account_limited" && !input.voterId)
    throw new HttpError(
      401,
      "AUTHENTICATION_REQUIRED",
      "Sign in is required to vote in this poll",
    );
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
  if (poll.voterPriceMinor !== null)
    throw new HttpError(
      402,
      "PAYMENT_REQUIRED",
      "This poll requires a voter payment; payment processing is not enabled yet",
    );
  if (poll.votingPolicy === "account_limited" && input.voterId) {
    const [existing] = await db
      .select({ id: votes.id })
      .from(votes)
      .where(
        and(eq(votes.pollId, input.pollId), eq(votes.voterId, input.voterId)),
      )
      .limit(1);
    if (existing)
      throw new HttpError(
        409,
        "ALREADY_VOTED",
        "This account has already voted in this poll",
      );
  }
  return {
    eligible: true,
    pollType: poll.pollType,
    votingPolicy: poll.votingPolicy,
  };
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
    .select()
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
      await checkEligibility(tx, input);
      const [vote] = await tx
        .insert(votes)
        .values({
          pollId: input.pollId,
          optionId: input.optionId,
          voterId: input.voterId ?? null,
          idempotencyKey: input.idempotencyKey,
        })
        .returning();
      return { vote, replayed: false };
    });
  } catch (error) {
    const [idempotentVote] = await db
      .select()
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
        .select()
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

export async function getMyVote(db: Database, pollId: string, voterId: string) {
  const [vote] = await db
    .select()
    .from(votes)
    .where(and(eq(votes.pollId, pollId), eq(votes.voterId, voterId)))
    .limit(1);
  return vote ?? null;
}
