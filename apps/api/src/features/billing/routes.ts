import { type Router as ExpressRouter, Router } from "express";
import { z } from "zod";
import type { Database } from "../../db/client.js";
import {
  assertAuthenticated,
  requireAuth,
} from "../../shared/authentication.js";
import { HttpError } from "../../shared/errors.js";
import { createPaymentIntentSchema, idempotencySchema } from "./schema.js";
import * as billing from "./service.js";

export function createBillingRouter(db: Database): ExpressRouter {
  const router = Router();
  router.use(requireAuth);
  router.post("/intents", async (request, response, next) => {
    try {
      const body = createPaymentIntentSchema.safeParse(request.body);
      const key = idempotencySchema.safeParse(
        request.header("Idempotency-Key"),
      );
      if (!body.success)
        throw new HttpError(
          400,
          "INVALID_PAYMENT_INTENT",
          "Payment details are invalid",
          body.error.flatten(),
        );
      if (!key.success)
        throw new HttpError(
          400,
          "IDEMPOTENCY_KEY_REQUIRED",
          "Provide a valid Idempotency-Key header",
        );
      const { user } = assertAuthenticated(request);
      const result = await billing.createPaymentIntent(db, {
        ...body.data,
        userId: user.id,
        idempotencyKey: key.data,
      });
      response.status(result.replayed ? 200 : 202).json({
        data: result.payment,
        meta: { providerEnabled: false, replayed: result.replayed },
      });
    } catch (error) {
      next(error);
    }
  });
  router.get("/intents/:paymentId", async (request, response, next) => {
    try {
      const id = z.string().uuid().safeParse(request.params.paymentId);
      if (!id.success)
        throw new HttpError(
          400,
          "INVALID_PAYMENT_ID",
          "Payment ID must be a UUID",
        );
      const { user } = assertAuthenticated(request);
      response.json({
        data: await billing.getPayment(db, id.data, user.id),
        meta: { providerEnabled: false },
      });
    } catch (error) {
      next(error);
    }
  });
  router.get("/ledger", async (request, response, next) => {
    try {
      const query = z
        .object({
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(100).default(20),
        })
        .safeParse(request.query);
      if (!query.success)
        throw new HttpError(
          400,
          "INVALID_PAGINATION",
          "Ledger pagination is invalid",
        );
      response.json(
        await billing.listLedger(
          db,
          assertAuthenticated(request).user.id,
          query.data.page,
          query.data.limit,
        ),
      );
    } catch (error) {
      next(error);
    }
  });
  return router;
}
