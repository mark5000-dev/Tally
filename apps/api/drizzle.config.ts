import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations run over a direct connection rather than the pooler. Neon's
    // pooled endpoint sits behind PgBouncer in transaction mode, which cannot
    // hold a session open for the DDL and advisory locks a migration needs, so
    // the unpooled URL is preferred when the host supplies both. The running
    // API keeps using the pooled one.
    //
    // Keep `?sslmode=require` (or `verify-full`) on a hosted URL: this config
    // uses node-postgres, which does not add TLS on its own.
    url:
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.DATABASE_URL ??
      "postgres://tally:tally_local_only@localhost:5432/tally",
  },
});
