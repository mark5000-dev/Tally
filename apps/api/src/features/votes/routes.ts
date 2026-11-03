import { and, count, eq } from "drizzle-orm";
import { type Router as ExpressRouter, Router } from "express";
import type { Database } from "../../db/client.js";
import { pollOptions, polls, votes } from "../../db/schema.js";
import {
  assertAuthenticated,
  requireAuth,
} from "../../shared/authentication.js";
import { HttpError } from "../../shared/errors.js";
import { canViewResults } from "../polls/policy.js";
import { pollIdSchema } from "../polls/schema.js";
import { getPoll } from "../polls/service.js";
import { castVoteSchema, idempotencyKeySchema } from "./schema.js";
import * as voteService from "./service.js";

export function createVotesRouter(db: Database): ExpressRouter {
  const router = Router({ mergeParams: true });
  const getPollId = (request: { params: unknown }) =>
    (request.params as Record<string, string>).pollId;
  router.get("/eligibility", async (request, response, next) => {
    try {
      const pollId = pollIdSchema.safeParse(getPollId(request));
      if (!pollId.success)
        throw new HttpError(400, "INVALID_POLL_ID", "Poll ID must be a UUID");
      response.json({
        data: await voteService.evaluateEligibility(db, {
          pollId: pollId.data,
          voterId: request.auth?.user.id,
        }),
      });
    } catch (error) {
      next(error);
    }
  });
  router.get("/me", requireAuth, async (request, response, next) => {
    try {
      const pollId = pollIdSchema.safeParse(getPollId(request));
      if (!pollId.success)
        throw new HttpError(400, "INVALID_POLL_ID", "Poll ID must be a UUID");
      const { user } = assertAuthenticated(request);
      response.json({
        data: await voteService.getMyVote(db, pollId.data, user.id),
      });
    } catch (error) {
      next(error);
    }
  });
  router.get("/results", async (request, response, next) => {
    try {
      const pollId = pollIdSchema.safeParse(getPollId(request));
      if (!pollId.success)
        throw new HttpError(400, "INVALID_POLL_ID", "Poll ID must be a UUID");
      const [poll] = await db
        .select()
        .from(polls)
        .where(eq(polls.id, pollId.data))
        .limit(1);
      if (!poll || poll.status === "removed")
        throw new HttpError(404, "POLL_NOT_FOUND", "Poll not found");
      let viewerHasVoted = false;
      if (poll.resultVisibility === "after_vote" && request.auth?.user.id) {
        viewerHasVoted = Boolean(
          await voteService.getMyVote(db, poll.id, request.auth.user.id),
        );
      }
      if (
        !canViewResults({
          visibility: poll.resultVisibility as
            | "public"
            | "after_vote"
            | "after_close",
          status: poll.status,
          viewerHasVoted,
        })
      )
        throw new HttpError(
          403,
          "RESULTS_HIDDEN",
          "Results are not available yet",
        );
      const results = await db
        .select({
          optionId: pollOptions.id,
          label: pollOptions.label,
          votes: count(votes.id),
        })
        .from(pollOptions)
        .leftJoin(
          votes,
          and(eq(votes.optionId, pollOptions.id), eq(votes.pollId, poll.id)),
        )
        .where(eq(pollOptions.pollId, poll.id))
        .groupBy(pollOptions.id)
        .orderBy(pollOptions.position);
      response.json({
        data: {
          pollId: poll.id,
          totalVotes: results.reduce((sum, row) => sum + Number(row.votes), 0),
          options: results.map((row) => ({ ...row, votes: Number(row.votes) })),
        },
      });
    } catch (error) {
      next(error);
    }
  });
  router.post("/", async (request, response, next) => {
    try {
      const pollId = pollIdSchema.safeParse(getPollId(request));
      const body = castVoteSchema.safeParse(request.body);
      const key = idempotencyKeySchema.safeParse(
        request.header("Idempotency-Key"),
      );
      if (!pollId.success)
        throw new HttpError(400, "INVALID_POLL_ID", "Poll ID must be a UUID");
      if (!body.success)
        throw new HttpError(
          400,
          "INVALID_VOTE",
          "A valid optionId is required",
          body.error.flatten(),
        );
      if (!key.success)
        throw new HttpError(
          400,
          "IDEMPOTENCY_KEY_REQUIRED",
          "Provide a valid Idempotency-Key header",
        );
      const { vote, replayed } = await voteService.castVote(db, {
        pollId: pollId.data,
        optionId: body.data.optionId,
        voterId: request.auth?.user.id,
        idempotencyKey: key.data,
      });
      const poll = await getPoll(db, pollId.data, request.auth?.user.id, true);
      // castVote already proved the poll exists and is published, so this only
      // fires if that invariant breaks. Spreading null would otherwise answer
      // with a poll object stripped of every field.
      if (!poll)
        throw new HttpError(404, "POLL_NOT_FOUND", "Poll not found");
      response.status(replayed ? 200 : 201).json({
        data: { ...poll, vote, replayed },
      });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
