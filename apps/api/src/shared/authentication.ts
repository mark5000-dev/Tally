import { createHash } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import type { Database } from "../db/client.js";
import { sessions, users } from "../db/schema.js";
import { HttpError } from "./errors.js";
import type { AuthenticatedRequest } from "./types.js";

export const SESSION_COOKIE = "tally_session";
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function loadSession(db: Database, token: string | undefined) {
  if (!token) return null;
  const [row] = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      userId: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      lastUsedAt: sessions.lastUsedAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return row ?? null;
}

export function optionalAuth(db: Database) {
  return async (request: Request, _response: Response, next: NextFunction) => {
    try {
      const token = request.cookies?.[SESSION_COOKIE] as string | undefined;
      const session = await loadSession(db, token);
      if (session) {
        if (Date.now() - session.lastUsedAt.getTime() > 10 * 60 * 1000) {
          await db
            .update(sessions)
            .set({ lastUsedAt: new Date() })
            .where(eq(sessions.id, session.sessionId));
        }
        request.auth = {
          sessionId: session.sessionId,
          user: {
            id: session.userId,
            email: session.email,
            displayName: session.displayName,
            role: session.role,
          },
        };
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAuth(
  _request: Request,
  _response: Response,
  next: NextFunction,
) {
  if (!(_request as AuthenticatedRequest).auth) {
    next(new HttpError(401, "AUTHENTICATION_REQUIRED", "Sign in is required"));
    return;
  }
  next();
}

export function requireAdmin(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  const auth = (request as AuthenticatedRequest).auth;
  if (!auth) {
    next(new HttpError(401, "AUTHENTICATION_REQUIRED", "Sign in is required"));
    return;
  }
  if (auth.user.role !== "admin") {
    next(
      new HttpError(
        403,
        "ADMIN_REQUIRED",
        "Administrator permission is required",
      ),
    );
    return;
  }
  next();
}

export function assertAuthenticated(
  request: Request,
): AuthenticatedRequest["auth"] {
  const auth = (request as AuthenticatedRequest).auth;
  if (!auth)
    throw new HttpError(401, "AUTHENTICATION_REQUIRED", "Sign in is required");
  return auth;
}
