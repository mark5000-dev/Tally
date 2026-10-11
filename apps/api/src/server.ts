import { createApp } from "./app.js";
import { createDatabase } from "./db/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const port = Number(process.env.API_PORT ?? 4001);
const { client, db } = createDatabase(databaseUrl);
const app = createApp(db);
const server = app.listen(port, () => {
  console.log(`Tally API listening on http://localhost:${port}`);
});

async function shutdown() {
  server.close(async () => {
    await client.end();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
