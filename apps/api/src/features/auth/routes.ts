import { type Router as ExpressRouter, Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import type { Database } from "../../db/client.js";
import {
  assertAuthenticated,
  requireAuth,
  SESSION_COOKIE,
} from "../../shared/authentication.js";
import { HttpError } from "../../shared/errors.js";
import {
  emailTokenSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  registerSchema,
} from "./schema.js";
import * as auth from "./service.js";

const baseCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
const verifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

export function createAuthRouter(db: Database): ExpressRouter {
  const router = Router();
  router.post("/register", authLimiter, async (request, response, next) => {
    try {
      const body = registerSchema.safeParse(request.body);
      if (!body.success)
        throw new HttpError(
          400,
          "INVALID_REGISTRATION",
          "Registration details are invalid",
          body.error.flatten(),
        );
      response.status(201).json({ data: await auth.register(db, body.data) });
    } catch (error) {
      next(error);
    }
  });
  router.post(
    "/verify-email",
    verifyLimiter,
    async (request, response, next) => {
      try {
        const body = emailTokenSchema.safeParse(request.body);
        if (!body.success)
          throw new HttpError(
            400,
            "INVALID_TOKEN",
            "A valid verification token is required",
          );
        response.json({ data: await auth.verifyEmail(db, body.data.token) });
      } catch (error) {
        next(error);
      }
    },
  );
  router.post(
    "/verification/resend",
    authLimiter,
    async (request, response, next) => {
      try {
        const body = passwordResetRequestSchema.safeParse(request.body);
        if (!body.success)
          throw new HttpError(
            400,
            "INVALID_EMAIL",
            "A valid email is required",
          );
        await auth.resendVerification(db, body.data.email);
        response.status(202).json({
          data: {
            message: "If verification is required, instructions have been sent",
          },
        });
      } catch (error) {
        next(error);
      }
    },
  );
  router.post("/login", authLimiter, async (request, response, next) => {
    try {
      const body = loginSchema.safeParse(request.body);
      if (!body.success)
        throw new HttpError(
          400,
          "INVALID_LOGIN",
          "Email and password are required",
        );
      const result = await auth.login(db, body.data, request);
      response.cookie(SESSION_COOKIE, result.token, {
        ...baseCookieOptions(),
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      response.json({
        data: { user: result.user, expiresAt: result.expiresAt },
      });
    } catch (error) {
      next(error);
    }
  });
  router.post("/logout", requireAuth, async (request, response, next) => {
    try {
      const { sessionId } = assertAuthenticated(request);
      await auth.logout(db, sessionId);
      response.clearCookie(SESSION_COOKIE, baseCookieOptions());
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  router.get("/me", requireAuth, (request, response) => {
    response.json({ data: assertAuthenticated(request).user });
  });
  router.get("/sessions", requireAuth, async (request, response, next) => {
    try {
      const { user } = assertAuthenticated(request);
      response.json({ data: await auth.listSessions(db, user.id) });
    } catch (error) {
      next(error);
    }
  });
  router.delete(
    "/sessions/:sessionId",
    requireAuth,
    async (request, response, next) => {
      try {
        const { user, sessionId: currentSessionId } =
          assertAuthenticated(request);
        const sessionId = z.string().uuid().safeParse(request.params.sessionId);
        if (!sessionId.success)
          throw new HttpError(
            400,
            "INVALID_SESSION_ID",
            "Session ID must be a UUID",
          );
        await auth.revokeSession(db, user.id, sessionId.data);
        if (sessionId.data === currentSessionId)
          response.clearCookie(SESSION_COOKIE, baseCookieOptions());
        response.status(204).end();
      } catch (error) {
        next(error);
      }
    },
  );
  router.post(
    "/password/forgot",
    authLimiter,
    async (request, response, next) => {
      try {
        const body = passwordResetRequestSchema.safeParse(request.body);
        if (!body.success)
          throw new HttpError(
            400,
            "INVALID_EMAIL",
            "A valid email is required",
          );
        await auth.requestPasswordReset(db, body.data.email);
        response.status(202).json({
          data: {
            message:
              "If an account exists, password reset instructions have been sent",
          },
        });
      } catch (error) {
        next(error);
      }
    },
  );
  router.post(
    "/password/reset",
    authLimiter,
    async (request, response, next) => {
      try {
        const body = passwordResetSchema.safeParse(request.body);
        if (!body.success)
          throw new HttpError(
            400,
            "INVALID_PASSWORD_RESET",
            "A valid token and new password are required",
          );
        await auth.resetPassword(db, body.data.token, body.data.password);
        response.status(204).end();
      } catch (error) {
        next(error);
      }
    },
  );
  return router;
}
