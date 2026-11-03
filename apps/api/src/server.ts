import { createApp } from "./app.js";
import { createDatabase } from "./db/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
// Failing here beats failing at the first sign-in. Without a web origin there
// is no CORS header to send and no origin the cookie-write guard will accept,
// so the deployment would look healthy while rejecting every write.
if (process.env.NODE_ENV === "production" && !process.env.WEB_ORIGIN)
  throw new Error("WEB_ORIGIN is required in production");

// Render, Railway, and Fly assign the port and expect the process to bind it;
// API_PORT is this project's local default.
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4001);
const host = process.env.HOST ?? "0.0.0.0";
const { client, db } = createDatabase(databaseUrl);
const app = createApp(db);
const server = app.listen(port, host, () => {
  console.log(`Tally API listening on http://${host}:${port}`);
});

async function shutdown() {
  server.close(async () => {
    await client.end();
    process.exit(0);
  });
  // A keep-alive connection that never drains must not hold the release open.
  // The host escalates to SIGKILL once its own grace period runs out, which
  // would skip `client.end()` entirely.
  setTimeout(() => process.exit(0), 10_000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
