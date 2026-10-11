import { randomUUID } from "node:crypto";
import cookieParser from "cookie-parser";
import cors from "cors";
import { sql } from "drizzle-orm";
import express from "express";
import { rateLimit } from "express-rate-limit";
import type { Database } from "./db/client.js";
import { createAdminRouter } from "./features/admin/routes.js";
import { createAuthRouter } from "./features/auth/routes.js";
import { createBillingRouter } from "./features/billing/routes.js";
import { createPollsRouter } from "./features/polls/routes.js";
import { createVotesRouter } from "./features/votes/routes.js";
import { optionalAuth } from "./shared/authentication.js";
import { HttpError } from "./shared/errors.js";

export function createApp(db: Database): express.Express {
  const app = express();
  const allowedOrigins = (process.env.WEB_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim());

  app.disable("x-powered-by");
  app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);
  app.use((request, response, next) => {
    const requestId =
      request.header("x-request-id")?.slice(0, 100) || randomUUID();
    response.setHeader("x-request-id", requestId);
    next();
  });
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Idempotency-Key", "X-Request-Id"],
    }),
  );
  app.use(express.json({ limit: "32kb" }));
  app.use(cookieParser());
  app.get("/health", (_request, response) => response.json({ status: "ok" }));
  app.get("/ready", async (_request, response, next) => {
    try {
      await db.execute(sql`select 1`);
      response.json({ status: "ready" });
    } catch (error) {
      next(error);
    }
  });
  app.use(
    "/api",
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  app.use("/api/v1", optionalAuth(db));
  app.use("/api/v1", (request, _response, next) => {
    if (
      ["POST", "PATCH", "PUT", "DELETE"].includes(request.method) &&
      request.cookies?.tally_session
    ) {
      const origin = request.header("origin");
      if (!origin || !allowedOrigins.includes(origin)) {
        next(
          new HttpError(403, "INVALID_ORIGIN", "Request origin is not allowed"),
        );
        return;
      }
    }
    next();
  });

  app.use("/api/v1/auth", createAuthRouter(db));
  app.use("/api/v1/polls", createPollsRouter(db));
  app.use("/api/v1/polls/:pollId/votes", createVotesRouter(db));
  app.use("/api/v1/billing", createBillingRouter(db));
  app.use("/api/v1/admin", createAdminRouter(db));

  app.use((_request, response) =>
    response
      .status(404)
      .json({ error: { code: "NOT_FOUND", message: "Route not found" } }),
  );
  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction,
    ) => {
      if (error instanceof HttpError) {
        response.status(error.status).json({
          error: {
            code: error.code,
            message: error.message,
            ...(error.details ? { details: error.details } : {}),
          },
        });
        return;
      }
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        response.status(409).json({
          error: {
            code: "CONFLICT",
            message: "A record with those details already exists",
          },
        });
        return;
      }
      if (error instanceof SyntaxError) {
        response.status(400).json({
          error: {
            code: "INVALID_JSON",
            message: "Request body must be valid JSON",
          },
        });
        return;
      }
      console.error(error);
      response.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      });
    },
  );

  return app;
}
