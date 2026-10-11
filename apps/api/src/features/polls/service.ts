import {
  and,
  count,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import type { Database } from "../../db/client.js";
import {
  payments,
  pollOptions,
  pollReports,
  polls,
  users,
  votes,
} from "../../db/schema.js";
import { HttpError } from "../../shared/errors.js";
import { canViewResults } from "./policy.js";

const CREATOR_TYPE_CHARGES: Record<"community" | "featured", number> = {
  community: 0,
  featured: Number(process.env.FEATURED_POLL_CHARGE_MINOR ?? 10000),
};

export interface PollInput {
  title: string;
  description?: string | null;
  category: string;
  options: string[];
  pollType?: "community" | "featured";
  votingPolicy?: "open" | "account_limited";
  voterPriceMinor?: number | null;
  creatorShareBasisPoints?: number | null;
  resultVisibility?: "public" | "after_vote" | "after_close";
  startsAt?: string | null;
  endsAt?: string | null;
}

async function attachResults(
  db: Database,
  rows: Array<typeof polls.$inferSelect & { creatorName: string }>,
  viewerId?: string,
  votedPollIdsOverride: Set<string> = new Set(),
) {
  const ids = rows.map((poll) => poll.id);
  const viewerVotes =
    viewerId && ids.length
      ? await db
          .select({ pollId: votes.pollId })
          .from(votes)
          .where(and(eq(votes.voterId, viewerId), inArray(votes.pollId, ids)))
      : [];
  const votedPollIds = new Set(viewerVotes.map((vote) => vote.pollId));
  const options = ids.length
    ? await db
        .select({
          id: pollOptions.id,
          pollId: pollOptions.pollId,
          label: pollOptions.label,
          position: pollOptions.position,
          votes: sql<number>`count(${votes.id})::int`,
        })
        .from(pollOptions)
        .leftJoin(votes, eq(votes.optionId, pollOptions.id))
        .where(inArray(pollOptions.pollId, ids))
        .groupBy(pollOptions.id)
        .orderBy(pollOptions.position)
    : [];
  const byPoll = new Map<string, typeof options>();
  for (const option of options)
    byPoll.set(option.pollId, [...(byPoll.get(option.pollId) ?? []), option]);
  return rows.map((poll) => {
    const includeVotes = canViewResults({
      visibility: poll.resultVisibility as
        | "public"
        | "after_vote"
        | "after_close",
      status: poll.status,
      viewerHasVoted:
        votedPollIds.has(poll.id) || votedPollIdsOverride.has(poll.id),
    });
    const pollOptionsResult = byPoll.get(poll.id) ?? [];
    const totalVotes = pollOptionsResult.reduce(
      (total, option) => total + Number(option.votes),
      0,
    );
    const leader = [...pollOptionsResult].sort(
      (left, right) => Number(right.votes) - Number(left.votes),
    )[0];
    return {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      category: poll.category,
      status: poll.status,
      pollType: poll.pollType,
      creatorTypeChargeMinor: poll.creatorTypeChargeMinor,
      votingPolicy: poll.votingPolicy,
      voterPriceMinor: poll.voterPriceMinor,
      isPaid: poll.voterPriceMinor !== null,
      price: poll.voterPriceMinor,
      resultVisibility: poll.resultVisibility,
      startsAt: poll.startsAt?.toISOString() ?? null,
      endsAt: poll.endsAt?.toISOString() ?? null,
      currency: poll.currency,
      isFeatured: poll.isFeatured,
      creator: poll.creatorName,
      totalVotes: includeVotes ? totalVotes : null,
      leading: includeVotes && totalVotes > 0 ? (leader?.label ?? null) : null,
      leadPct:
        includeVotes && totalVotes > 0
          ? Math.round((Number(leader?.votes ?? 0) / totalVotes) * 100)
          : null,
      options: pollOptionsResult.map((option) => ({
        id: option.id,
        label: option.label,
        position: option.position,
        votes: includeVotes ? Number(option.votes) : null,
      })),
      createdAt: poll.createdAt.toISOString(),
      updatedAt: poll.updatedAt.toISOString(),
    };
  });
}

export async function listPublicPolls(
  db: Database,
  input: {
    page: number;
    limit: number;
    q?: string;
    category?: string;
    pollType?: string;
    paid?: "true" | "false";
    status: "published" | "closed";
  },
  viewerId?: string,
) {
  const filters = [
    inArray(
      polls.status,
      input.status === "published" ? ["published"] : ["closed"],
    ),
  ];
  if (input.status === "published") {
    const startFilter = or(
      isNull(polls.startsAt),
      lte(polls.startsAt, new Date()),
    );
    const endFilter = or(isNull(polls.endsAt), gt(polls.endsAt, new Date()));
    if (startFilter) filters.push(startFilter);
    if (endFilter) filters.push(endFilter);
  }
  if (input.q)
    filters.push(
      ilike(
        polls.title,
        `%${input.q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`,
      ),
    );
  if (input.category) filters.push(eq(polls.category, input.category));
  if (input.pollType) filters.push(eq(polls.pollType, input.pollType));
  if (input.paid === "true") filters.push(isNotNull(polls.voterPriceMinor));
  if (input.paid === "false") filters.push(isNull(polls.voterPriceMinor));

  const where = and(...filters);
  const [totalRow] = await db
    .select({ total: count() })
    .from(polls)
    .where(where);
  const pageRows = await db
    .select({ poll: polls, creatorName: users.displayName })
    .from(polls)
    .innerJoin(users, eq(users.id, polls.creatorId))
    .where(where)
    .orderBy(desc(polls.isFeatured), desc(polls.createdAt))
    .limit(input.limit)
    .offset((input.page - 1) * input.limit);
  const data = await attachResults(
    db,
    pageRows.map((row) => ({ ...row.poll, creatorName: row.creatorName })),
    viewerId,
  );
  return {
    data,
    pagination: {
      page: input.page,
      limit: input.limit,
      total: Number(totalRow?.total ?? 0),
      pages: Math.ceil(Number(totalRow?.total ?? 0) / input.limit),
    },
  };
}

export async function getPoll(
  db: Database,
  pollId: string,
  viewerId?: string,
  viewerHasVotedOverride = false,
) {
  const [row] = await db
    .select({ poll: polls, creatorName: users.displayName })
    .from(polls)
    .innerJoin(users, eq(users.id, polls.creatorId))
    .where(eq(polls.id, pollId))
    .limit(1);
  if (
    !row ||
    row.poll.status === "removed" ||
    (row.poll.status === "draft" && row.poll.creatorId !== viewerId)
  )
    return null;
  let viewerHasVoted = false;
  if (viewerId && row.poll.resultVisibility === "after_vote") {
    const [ownVote] = await db
      .select({ id: votes.id })
      .from(votes)
      .where(and(eq(votes.pollId, pollId), eq(votes.voterId, viewerId)))
      .limit(1);
    viewerHasVoted = Boolean(ownVote);
  }
  const [result] = await attachResults(
    db,
    [{ ...row.poll, creatorName: row.creatorName }],
    viewerHasVoted ? viewerId : undefined,
    viewerHasVotedOverride ? new Set([pollId]) : undefined,
  );
  return result;
}

async function assertOwner(db: Database, pollId: string, userId: string) {
  const [poll] = await db
    .select()
    .from(polls)
    .where(and(eq(polls.id, pollId), eq(polls.creatorId, userId)))
    .limit(1);
  if (!poll) throw new HttpError(404, "POLL_NOT_FOUND", "Poll not found");
  return poll;
}

export async function createPoll(
  db: Database,
  userId: string,
  input: PollInput,
) {
  const type = input.pollType ?? "community";
  const now = new Date();
  return db.transaction(async (tx) => {
    const [poll] = await tx
      .insert(polls)
      .values({
        creatorId: userId,
        title: input.title,
        description: input.description ?? null,
        category: input.category,
        pollType: type,
        creatorTypeChargeMinor: CREATOR_TYPE_CHARGES[type],
        votingPolicy: input.votingPolicy ?? "open",
        voterPriceMinor: input.voterPriceMinor ?? null,
        creatorShareBasisPoints: input.creatorShareBasisPoints ?? null,
        resultVisibility: input.resultVisibility ?? "public",
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        isFeatured: type === "featured",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    await tx.insert(pollOptions).values(
      input.options.map((label, position) => ({
        pollId: poll.id,
        label,
        position,
      })),
    );
    return poll;
  });
}

export async function updatePoll(
  db: Database,
  pollId: string,
  userId: string,
  input: Partial<PollInput>,
) {
  const poll = await assertOwner(db, pollId, userId);
  if (poll.status !== "draft")
    throw new HttpError(
      409,
      "POLL_NOT_EDITABLE",
      "Only draft polls can be edited",
    );
  return db.transaction(async (tx) => {
    const { options, startsAt, endsAt, ...fields } = input;
    const [updated] = await tx
      .update(polls)
      .set({
        ...fields,
        startsAt:
          startsAt === undefined
            ? undefined
            : startsAt
              ? new Date(startsAt)
              : null,
        endsAt:
          endsAt === undefined ? undefined : endsAt ? new Date(endsAt) : null,
        updatedAt: new Date(),
      })
      .where(eq(polls.id, pollId))
      .returning();
    if (options) {
      await tx.delete(pollOptions).where(eq(pollOptions.pollId, pollId));
      await tx
        .insert(pollOptions)
        .values(
          options.map((label, position) => ({ pollId, label, position })),
        );
    }
    return updated;
  });
}

export async function publishPoll(
  db: Database,
  pollId: string,
  userId: string,
) {
  const poll = await assertOwner(db, pollId, userId);
  if (poll.status !== "draft")
    throw new HttpError(
      409,
      "INVALID_POLL_STATE",
      "Only draft polls can be published",
    );
  const [options] = await db
    .select({ total: count() })
    .from(pollOptions)
    .where(eq(pollOptions.pollId, pollId));
  if (Number(options?.total ?? 0) < 2)
    throw new HttpError(
      409,
      "POLL_NEEDS_OPTIONS",
      "A poll must have at least two options",
    );
  if (poll.creatorTypeChargeMinor > 0) {
    const [paid] = await db
      .select({ id: payments.id })
      .from(payments)
      .where(
        and(
          eq(payments.pollId, pollId),
          eq(payments.userId, userId),
          eq(payments.purpose, "creator_poll_type"),
          eq(payments.status, "succeeded"),
        ),
      )
      .limit(1);
    if (!paid)
      throw new HttpError(
        402,
        "CREATOR_CHARGE_REQUIRED",
        "A confirmed creator charge is required before publishing this poll",
      );
  }
  await db
    .update(polls)
    .set({ status: "published", updatedAt: new Date() })
    .where(eq(polls.id, pollId));
  return { status: "published" as const };
}

export async function closePoll(db: Database, pollId: string, userId: string) {
  const poll = await assertOwner(db, pollId, userId);
  if (poll.status !== "published")
    throw new HttpError(
      409,
      "INVALID_POLL_STATE",
      "Only published polls can be closed",
    );
  await db
    .update(polls)
    .set({ status: "closed", updatedAt: new Date() })
    .where(eq(polls.id, pollId));
}

export async function reportPoll(
  db: Database,
  pollId: string,
  reporterId: string | null,
  reason: string,
  details?: string,
) {
  const [poll] = await db
    .select({ id: polls.id })
    .from(polls)
    .where(
      and(eq(polls.id, pollId), inArray(polls.status, ["published", "closed"])),
    )
    .limit(1);
  if (!poll) throw new HttpError(404, "POLL_NOT_FOUND", "Poll not found");
  const [report] = await db
    .insert(pollReports)
    .values({ pollId, reporterId, reason, details: details ?? null })
    .returning({
      id: pollReports.id,
      status: pollReports.status,
      createdAt: pollReports.createdAt,
    });
  return report;
}
