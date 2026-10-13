import { createHash, randomBytes } from "node:crypto";
import argon2 from "argon2";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import {
  emailVerifications,
  passwordResets,
  sessions,
  users,
} from "../../db/schema.js";
import { HttpError } from "../../shared/errors.js";
import { createOriginAllowlist } from "../../shared/origins.js";
import { sendAccountEmail } from "./mailer.js";

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");
// Builds the account fields a caller may see. `login` reads the whole users row
// in order to verify the password, so returning that row would put the argon2
// hash in the response body; only these fields may leave the API.
const publicUser = (user: {
  id: string;
  email: string;
  displayName: string;
  role: "member" | "admin";
}) => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  role: user.role,
});

function requestIp(request: { ip?: string }) {
  return request.ip ?? null;
}

function accountLink(path: string, token: string) {
  // WEB_ORIGIN may hold several entries, including wildcards that stand for
  // preview deployments. A wildcard is not something a recipient can click, so
  // the allowlist hands back the first address that is a real host.
  const origin = createOriginAllowlist().linkOrigin;
  return `${origin}${path}?token=${encodeURIComponent(token)}`;
}

export async function register(
  db: Database,
  input: { email: string; password: string; displayName: string },
) {
  const email = input.email.trim().toLowerCase();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    throw new HttpError(
      409,
      "EMAIL_IN_USE",
      "An account with this email already exists",
    );
  }

  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, displayName: input.displayName.trim() })
    .returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
    });
  const token = newToken();
  await db.insert(emailVerifications).values({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  await sendAccountEmail({
    to: email,
    subject: "Verify your Tally account",
    text: `Verify your email within 24 hours: ${accountLink("/verify-email", token)}`,
  });
  return { user: publicUser(user), verificationRequired: true };
}

export async function verifyEmail(db: Database, token: string) {
  const verification = await db.transaction(async (tx) => {
    const [claimed] = await tx
      .update(emailVerifications)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(emailVerifications.tokenHash, hashToken(token)),
          isNull(emailVerifications.consumedAt),
          gt(emailVerifications.expiresAt, new Date()),
        ),
      )
      .returning({ userId: emailVerifications.userId });
    if (!claimed) return null;
    await tx
      .update(users)
      .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, claimed.userId));
    return claimed;
  });
  if (!verification) {
    throw new HttpError(
      400,
      "INVALID_VERIFICATION_TOKEN",
      "This verification link is invalid or expired",
    );
  }
  return { verified: true };
}

export async function resendVerification(db: Database, emailInput: string) {
  const email = emailInput.trim().toLowerCase();
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user || user.emailVerifiedAt) return;

  const token = newToken();
  await db.transaction(async (tx) => {
    await tx
      .update(emailVerifications)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(emailVerifications.userId, user.id),
          isNull(emailVerifications.consumedAt),
        ),
      );
    await tx.insert(emailVerifications).values({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  });
  await sendAccountEmail({
    to: user.email,
    subject: "Verify your Tally account",
    text: `Verify your email within 24 hours: ${accountLink("/verify-email", token)}`,
  });
}

export async function login(
  db: Database,
  input: { email: string; password: string },
  request: { ip?: string; headers: Record<string, unknown> },
) {
  const email = input.email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user || !(await argon2.verify(user.passwordHash, input.password))) {
    throw new HttpError(
      401,
      "INVALID_CREDENTIALS",
      "Email or password is incorrect",
    );
  }
  if (!user.emailVerifiedAt) {
    throw new HttpError(
      403,
      "EMAIL_NOT_VERIFIED",
      "Verify your email before signing in",
    );
  }

  const token = newToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const [session] = await db
    .insert(sessions)
    .values({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt,
      ipAddress: requestIp(request),
      userAgent:
        typeof request.headers["user-agent"] === "string"
          ? request.headers["user-agent"]
          : null,
    })
    .returning({ id: sessions.id });
  return { token, sessionId: session.id, expiresAt, user: publicUser(user) };
}

export async function logout(db: Database, sessionId: string) {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)));
}

export async function listSessions(db: Database, userId: string) {
  return db
    .select({
      id: sessions.id,
      createdAt: sessions.createdAt,
      expiresAt: sessions.expiresAt,
      lastUsedAt: sessions.lastUsedAt,
      userAgent: sessions.userAgent,
      ipAddress: sessions.ipAddress,
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .orderBy(sessions.createdAt);
}

export async function revokeSession(
  db: Database,
  userId: string,
  sessionId: string,
) {
  const [session] = await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(sessions.id, sessionId),
        eq(sessions.userId, userId),
        isNull(sessions.revokedAt),
      ),
    )
    .returning({ id: sessions.id });
  if (!session) {
    throw new HttpError(404, "SESSION_NOT_FOUND", "Session not found");
  }
}

export async function requestPasswordReset(db: Database, emailInput: string) {
  const email = emailInput.trim().toLowerCase();
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) return;

  const token = newToken();
  await db.insert(passwordResets).values({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });
  await sendAccountEmail({
    to: user.email,
    subject: "Reset your Tally password",
    text: `Reset your password within 30 minutes: ${accountLink("/reset-password", token)}`,
  });
}

export async function resetPassword(
  db: Database,
  token: string,
  password: string,
) {
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const reset = await db.transaction(async (tx) => {
    const [claimed] = await tx
      .update(passwordResets)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(passwordResets.tokenHash, hashToken(token)),
          isNull(passwordResets.consumedAt),
          gt(passwordResets.expiresAt, new Date()),
        ),
      )
      .returning({ userId: passwordResets.userId });
    if (!claimed) return null;
    await tx
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, claimed.userId));
    await tx
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(sessions.userId, claimed.userId), isNull(sessions.revokedAt)),
      );
    return claimed;
  });
  if (!reset) {
    throw new HttpError(
      400,
      "INVALID_RESET_TOKEN",
      "This password reset link is invalid or expired",
    );
  }
}
