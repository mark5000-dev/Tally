import { type Router as ExpressRouter, Router } from "express";
import type { Database } from "../../db/client.js";
import {
  assertAuthenticated,
  requireAuth,
} from "../../shared/authentication.js";
import { HttpError } from "../../shared/errors.js";
import {
  createPollSchema,
  pollIdSchema,
  pollListQuerySchema,
  reportSchema,
  updatePollSchema,
} from "./schema.js";
import * as polls from "./service.js";

export function createPollsRouter(db: Database): ExpressRouter {
  const router = Router();
  router.get("/", async (request, response, next) => {
    try {
      const query = pollListQuerySchema.safeParse(request.query);
      if (!query.success)
        throw new HttpError(
          400,
          "INVALID_POLL_QUERY",
          "Poll filters are invalid",
          query.error.flatten(),
        );
      const result = await polls.listPublicPolls(
        db,
        query.data,
        request.auth?.user.id,
      );
      response.json({ data: result.data, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  });
  router.get("/:pollId", async (request, response, next) => {
    try {
      const pollId = pollIdSchema.safeParse(request.params.pollId);
      if (!pollId.success)
        throw new HttpError(400, "INVALID_POLL_ID", "Poll ID must be a UUID");
      const result = await polls.getPoll(
        db,
        pollId.data,
        request.auth?.user.id,
      );
      if (!result) throw new HttpError(404, "POLL_NOT_FOUND", "Poll not found");
      response.json({ data: result });
    } catch (error) {
      next(error);
    }
  });
  router.post("/", requireAuth, async (request, response, next) => {
    try {
      const body = createPollSchema.safeParse(request.body);
      if (!body.success)
        throw new HttpError(
          400,
          "INVALID_POLL",
          "Poll details are invalid",
          body.error.flatten(),
        );
      response.status(201).json({
        data: await polls.createPoll(
          db,
          assertAuthenticated(request).user.id,
          body.data,
        ),
      });
    } catch (error) {
      next(error);
    }
  });
  router.patch("/:pollId", requireAuth, async (request, response, next) => {
    try {
      const pollId = pollIdSchema.safeParse(request.params.pollId);
      const body = updatePollSchema.safeParse(request.body);
      if (!pollId.success)
        throw new HttpError(400, "INVALID_POLL_ID", "Poll ID must be a UUID");
      if (!body.success)
        throw new HttpError(
          400,
          "INVALID_POLL",
          "Poll changes are invalid",
          body.error.flatten(),
        );
      response.json({
        data: await polls.updatePoll(
          db,
          pollId.data,
          assertAuthenticated(request).user.id,
          body.data,
        ),
      });
    } catch (error) {
      next(error);
    }
  });
  router.post(
    "/:pollId/publish",
    requireAuth,
    async (request, response, next) => {
      try {
        const pollId = pollIdSchema.safeParse(request.params.pollId);
        if (!pollId.success)
          throw new HttpError(400, "INVALID_POLL_ID", "Poll ID must be a UUID");
        response.json({
          data: await polls.publishPoll(
            db,
            pollId.data,
            assertAuthenticated(request).user.id,
          ),
        });
      } catch (error) {
        next(error);
      }
    },
  );
  router.post(
    "/:pollId/close",
    requireAuth,
    async (request, response, next) => {
      try {
        const pollId = pollIdSchema.safeParse(request.params.pollId);
        if (!pollId.success)
          throw new HttpError(400, "INVALID_POLL_ID", "Poll ID must be a UUID");
        await polls.closePoll(
          db,
          pollId.data,
          assertAuthenticated(request).user.id,
        );
        response.status(204).end();
      } catch (error) {
        next(error);
      }
    },
  );
  router.post("/:pollId/reports", async (request, response, next) => {
    try {
      const pollId = pollIdSchema.safeParse(request.params.pollId);
      const body = reportSchema.safeParse(request.body);
      if (!pollId.success)
        throw new HttpError(400, "INVALID_POLL_ID", "Poll ID must be a UUID");
      if (!body.success)
        throw new HttpError(
          400,
          "INVALID_REPORT",
          "Report details are invalid",
          body.error.flatten(),
        );
      const report = await polls.reportPoll(
        db,
        pollId.data,
        request.auth?.user.id ?? null,
        body.data.reason,
        body.data.details,
      );
      response.status(201).json({ data: report });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
