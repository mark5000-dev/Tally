import { and, desc, eq } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import {
  auditLogs,
  ledgerEntries,
  payments,
  pollReports,
  polls,
  users,
} from "../../db/schema.js";
import { auditLogValues } from "../../shared/audit.js";
import { HttpError } from "../../shared/errors.js";

export async function listReports(
  db: Database,
  status: "open" | "reviewed" | "dismissed" | "actioned",
  page: number,
  limit: number,
) {
  const data = await db
    .select({
      report: pollReports,
      pollTitle: polls.title,
      pollStatus: polls.status,
      reporterEmail: users.email,
    })
    .from(pollReports)
    .innerJoin(polls, eq(polls.id, pollReports.pollId))
    .leftJoin(users, eq(users.id, pollReports.reporterId))
    .where(eq(pollReports.status, status))
    .orderBy(desc(pollReports.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
  return { data, pagination: { page, limit } };
}

export async function reviewReport(
  db: Database,
  input: {
    reportId: string;
    adminId: string;
    status: "reviewed" | "dismissed" | "actioned";
    moderation: "none" | "close" | "remove";
    note?: string;
    ipAddress?: string;
  },
) {
  const [report] = await db
    .select()
    .from(pollReports)
    .where(eq(pollReports.id, input.reportId))
    .limit(1);
  if (!report) throw new HttpError(404, "REPORT_NOT_FOUND", "Report not found");
  await db.transaction(async (tx) => {
    await tx
      .update(pollReports)
      .set({
        status: input.status,
        reviewedBy: input.adminId,
        reviewedAt: new Date(),
        details: input.note
          ? `${report.details ?? ""}\n[Admin note] ${input.note}`.trim()
          : report.details,
      })
      .where(eq(pollReports.id, report.id));
    if (input.moderation !== "none") {
      const status = input.moderation === "remove" ? "removed" : "closed";
      await tx
        .update(polls)
        .set({ status, updatedAt: new Date() })
        .where(eq(polls.id, report.pollId));
    }
    await tx.insert(auditLogs).values(
      auditLogValues({
        actorId: input.adminId,
        action: `report.${input.status}`,
        entityType: "poll_report",
        entityId: report.id,
        metadata: {
          pollId: report.pollId,
          moderation: input.moderation,
          note: input.note ?? null,
        },
        ipAddress: input.ipAddress,
      }),
    );
  });
}

export async function moderatePoll(
  db: Database,
  input: {
    pollId: string;
    adminId: string;
    action: "close" | "remove" | "restore";
    reason: string;
    ipAddress?: string;
  },
) {
  const [poll] = await db
    .select()
    .from(polls)
    .where(eq(polls.id, input.pollId))
    .limit(1);
  if (!poll) throw new HttpError(404, "POLL_NOT_FOUND", "Poll not found");
  if (input.action === "restore" && poll.status !== "removed")
    throw new HttpError(
      409,
      "INVALID_MODERATION_STATE",
      "Only removed polls can be restored",
    );
  const status =
    input.action === "remove"
      ? "removed"
      : input.action === "close"
        ? "closed"
        : "published";
  await db.transaction(async (tx) => {
    await tx
      .update(polls)
      .set({ status, updatedAt: new Date() })
      .where(eq(polls.id, poll.id));
    await tx.insert(auditLogs).values(
      auditLogValues({
        actorId: input.adminId,
        action: `poll.${input.action}`,
        entityType: "poll",
        entityId: poll.id,
        metadata: { reason: input.reason, previousStatus: poll.status, status },
        ipAddress: input.ipAddress,
      }),
    );
  });
  return { id: poll.id, status };
}

export async function lookupPayment(db: Database, paymentId: string) {
  const [payment] = await db
    .select({
      payment: payments,
      userEmail: users.email,
      pollTitle: polls.title,
    })
    .from(payments)
    .innerJoin(users, eq(users.id, payments.userId))
    .leftJoin(polls, eq(polls.id, payments.pollId))
    .where(eq(payments.id, paymentId))
    .limit(1);
  if (!payment)
    throw new HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
  const ledger = await db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.paymentId, paymentId));
  return { ...payment, ledger };
}

export async function getAuditLog(
  db: Database,
  page: number,
  limit: number,
  entityType?: string,
  entityId?: string,
) {
  const filters = [];
  if (entityType) filters.push(eq(auditLogs.entityType, entityType));
  if (entityId) filters.push(eq(auditLogs.entityId, entityId));
  const data = await db
    .select()
    .from(auditLogs)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
  return { data, pagination: { page, limit } };
}
