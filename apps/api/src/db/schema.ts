import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["member", "admin"]);
export const pollStatus = pgEnum("poll_status", [
  "draft",
  "published",
  "closed",
  "removed",
]);
export const votingPolicy = pgEnum("voting_policy", [
  "open",
  "account_limited",
]);
export const paymentStatus = pgEnum("payment_status", [
  "created",
  "pending",
  "succeeded",
  "failed",
  "expired",
  "reversed",
]);
export const reportStatus = pgEnum("report_status", [
  "open",
  "reviewed",
  "dismissed",
  "actioned",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  role: userRole("role").notNull().default("member"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const emailVerifications = pgTable(
  "email_verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("email_verifications_user_id_idx").on(table.userId)],
);

export const passwordResets = pgTable(
  "password_resets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("password_resets_user_id_idx").on(table.userId)],
);

export const polls = pgTable(
  "polls",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    status: pollStatus("status").notNull().default("draft"),
    pollType: text("poll_type").notNull().default("community"),
    creatorTypeChargeMinor: integer("creator_type_charge_minor")
      .notNull()
      .default(0),
    votingPolicy: votingPolicy("voting_policy").notNull().default("open"),
    voterPriceMinor: integer("voter_price_minor"),
    creatorShareBasisPoints: integer("creator_share_basis_points"),
    resultVisibility: text("result_visibility").notNull().default("public"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    currency: text("currency").notNull().default("KES"),
    isFeatured: boolean("is_featured").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("polls_status_created_at_idx").on(table.status, table.createdAt),
    index("polls_category_status_idx").on(table.category, table.status),
    index("polls_creator_created_at_idx").on(table.creatorId, table.createdAt),
    check(
      "polls_creator_charge_nonnegative",
      sql`${table.creatorTypeChargeMinor} >= 0`,
    ),
    check(
      "polls_voter_price_nonnegative",
      sql`${table.voterPriceMinor} IS NULL OR ${table.voterPriceMinor} > 0`,
    ),
    check(
      "polls_creator_share_range",
      sql`${table.creatorShareBasisPoints} IS NULL OR (${table.creatorShareBasisPoints} >= 0 AND ${table.creatorShareBasisPoints} <= 10000)`,
    ),
    check(
      "polls_time_range",
      sql`${table.startsAt} IS NULL OR ${table.endsAt} IS NULL OR ${table.startsAt} < ${table.endsAt}`,
    ),
  ],
);

export const pollOptions = pgTable(
  "poll_options",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("poll_options_poll_position_unique").on(
      table.pollId,
      table.position,
    ),
    uniqueIndex("poll_options_poll_label_unique").on(
      table.pollId,
      sql`lower(${table.label})`,
    ),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pollId: uuid("poll_id").references(() => polls.id, {
      onDelete: "restrict",
    }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull().default("KES"),
    purpose: text("purpose").notNull(),
    provider: text("provider").notNull().default("daraja"),
    providerReference: text("provider_reference").unique(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    status: paymentStatus("status").notNull().default("created"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [check("payments_amount_positive", sql`${table.amountMinor} > 0`)],
);

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    optionId: uuid("option_id")
      .notNull()
      .references(() => pollOptions.id, { onDelete: "cascade" }),
    voterId: uuid("voter_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    paymentId: uuid("payment_id").references(() => payments.id, {
      onDelete: "restrict",
    }),
    idempotencyKey: text("idempotency_key").notNull(),
    // Copied from the poll's voting policy at insert time. It exists so the
    // partial unique index below can enforce "one vote per account" for
    // account-limited polls without also forbidding repeat voting in open polls.
    voterUnique: boolean("voter_unique").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("votes_poll_option_idx").on(table.pollId, table.optionId),
    uniqueIndex("votes_poll_voter_unique")
      .on(table.pollId, table.voterId)
      .where(sql`${table.voterId} IS NOT NULL AND ${table.voterUnique}`),
    uniqueIndex("votes_poll_idempotency_unique").on(
      table.pollId,
      table.idempotencyKey,
    ),
  ],
);

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "restrict" }),
    ownerUserId: uuid("owner_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    account: text("account").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull().default("KES"),
    entryType: text("entry_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("ledger_entries_payment_id_idx").on(table.paymentId)],
);

export const pollReports = pgTable(
  "poll_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    reporterId: uuid("reporter_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reason: text("reason").notNull(),
    details: text("details"),
    status: reportStatus("status").notNull().default("open"),
    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("poll_reports_status_created_at_idx").on(
      table.status,
      table.createdAt,
    ),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("audit_logs_created_at_idx").on(table.createdAt)],
);
