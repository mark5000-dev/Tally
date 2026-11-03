import { eq } from "drizzle-orm";
import { auditLogValues } from "../shared/audit.js";
import { createDatabase } from "./client.js";
import { auditLogs, users } from "./schema.js";

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
if (!databaseUrl) throw new Error("DATABASE_URL is required");
if (!email)
  throw new Error("Set ADMIN_EMAIL to the existing account to promote");

const { client, db } = createDatabase(databaseUrl);
try {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) throw new Error(`No account exists for ${email}`);
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ role: "admin", updatedAt: new Date() })
      .where(eq(users.id, user.id));
    await tx.insert(auditLogs).values(
      auditLogValues({
        actorId: null,
        action: "user.promoted_to_admin",
        entityType: "user",
        entityId: user.id,
        metadata: { email },
      }),
    );
  });
  console.log(`Promoted ${email} to administrator`);
} finally {
  await client.end();
}
