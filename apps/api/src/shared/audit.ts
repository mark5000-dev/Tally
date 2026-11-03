import type { Database } from "../db/client.js";
import { auditLogs } from "../db/schema.js";

export type AuditInput = {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
};

export function auditLogValues(input: AuditInput) {
  return {
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata ?? {},
    ipAddress: input.ipAddress ?? null,
  };
}

export async function writeAudit(db: Database, input: AuditInput) {
  await db.insert(auditLogs).values(auditLogValues(input));
}
