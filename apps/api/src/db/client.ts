import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/**
 * Managed PostgreSQL (Neon, Render, RDS) refuses unencrypted connections, and a
 * URL that does not ask for TLS fails with an opaque socket error rather than a
 * useful message. Any hosted URL that does not say how to connect is therefore
 * read as requiring the server certificate to be verified.
 *
 * An explicit `sslmode` always wins, which is the escape hatch for a host
 * fronted by a certificate authority Node does not already trust.
 */
function sslOption(databaseUrl: string): { ssl?: "verify-full" } {
  try {
    const url = new URL(databaseUrl);
    if (LOCAL_HOSTS.has(url.hostname) || url.searchParams.has("sslmode")) {
      return {};
    }
    return { ssl: "verify-full" };
  } catch {
    // Not a URL we can parse, such as a unix socket path. Leave the client at
    // its defaults rather than guessing.
    return {};
  }
}

export function createDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    max: 10,
    // Neon hands out a PgBouncer endpoint in transaction pooling mode, which
    // does not support prepared statements. Drizzle runs fine without them.
    prepare: false,
    ...sslOption(databaseUrl),
  });
  return { client, db: drizzle(client, { schema }) };
}

export type Database = ReturnType<typeof createDatabase>["db"];
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
