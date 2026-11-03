import { type Router as ExpressRouter, Router } from "express";
import { z } from "zod";
import type { Database } from "../../db/client.js";
import {
  assertAuthenticated,
  requireAdmin,
} from "../../shared/authentication.js";
import { HttpError } from "../../shared/errors.js";
import { pollIdSchema } from "../polls/schema.js";
import { pollModerationSchema, reportReviewSchema } from "./schema.js";
import * as admin from "./service.js";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export function createAdminRouter(db: Database): ExpressRouter {
  const router = Router();
  router.use(requireAdmin);
  router.get("/reports", async (request, response, next) => {
    try {
      const query = paginationSchema
        .extend({
          status: z
            .enum(["open", "reviewed", "dismissed", "actioned"])
            .default("open"),
        })
        .safeParse(request.query);
      if (!query.success)
        throw new HttpError(400, "INVALID_QUERY", "Report filters are invalid");
      response.json(
        await admin.listReports(
          db,
          query.data.status,
          query.data.page,
          query.data.limit,
        ),
      );
    } catch (error) {
      next(error);
    }
  });
  router.patch("/reports/:reportId", async (request, response, next) => {
    try {
      const reportId = z.string().uuid().safeParse(request.params.reportId);
      const body = reportReviewSchema.safeParse(request.body);
      if (!reportId.success)
        throw new HttpError(
          400,
          "INVALID_REPORT_ID",
          "Report ID must be a UUID",
        );
      if (!body.success)
        throw new HttpError(
          400,
          "INVALID_REVIEW",
          "Review details are invalid",
          body.error.flatten(),
        );
      const { user } = assertAuthenticated(request);
      await admin.reviewReport(db, {
        reportId: reportId.data,
        adminId: user.id,
        ...body.data,
        ipAddress: request.ip,
      });
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  router.post("/polls/:pollId/moderation", async (request, response, next) => {
    try {
      const pollId = pollIdSchema.safeParse(request.params.pollId);
      const body = pollModerationSchema.safeParse(request.body);
      if (!pollId.success)
        throw new HttpError(400, "INVALID_POLL_ID", "Poll ID must be a UUID");
      if (!body.success)
        throw new HttpError(
          400,
          "INVALID_MODERATION",
          "Moderation details are invalid",
          body.error.flatten(),
        );
      const { user } = assertAuthenticated(request);
      response.json({
        data: await admin.moderatePoll(db, {
          pollId: pollId.data,
          adminId: user.id,
          ...body.data,
          ipAddress: request.ip,
        }),
      });
    } catch (error) {
      next(error);
    }
  });
  router.get("/payments/:paymentId", async (request, response, next) => {
    try {
      const paymentId = z.string().uuid().safeParse(request.params.paymentId);
      if (!paymentId.success)
        throw new HttpError(
          400,
          "INVALID_PAYMENT_ID",
          "Payment ID must be a UUID",
        );
      response.json({ data: await admin.lookupPayment(db, paymentId.data) });
    } catch (error) {
      next(error);
    }
  });
  router.get("/audit", async (request, response, next) => {
    try {
      const query = paginationSchema
        .extend({
          entityType: z.string().max(80).optional(),
          entityId: z.string().max(100).optional(),
        })
        .safeParse(request.query);
      if (!query.success)
        throw new HttpError(400, "INVALID_QUERY", "Audit filters are invalid");
      response.json(
        await admin.getAuditLog(
          db,
          query.data.page,
          query.data.limit,
          query.data.entityType,
          query.data.entityId,
        ),
      );
    } catch (error) {
      next(error);
    }
  });
  return router;
}
