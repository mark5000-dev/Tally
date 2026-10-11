import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { createDatabase } from "./client.js";
import { pollOptions, polls, users } from "./schema.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl)
  throw new Error("DATABASE_URL is required to seed the database");
const { client, db } = createDatabase(databaseUrl);

try {
  const email = "creator@example.test";
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  const seedPasswordHash = await argon2.hash(randomBytes(48).toString("hex"), {
    type: argon2.argon2id,
  });
  const [creator] = existing
    ? [existing]
    : await db
        .insert(users)
        .values({
          email,
          passwordHash: seedPasswordHash,
          displayName: "Tally Demo Creator",
        })
        .returning({ id: users.id });

  const seedPolls = [
    {
      id: "10000000-0000-4000-8000-000000000001",
      title: "Who is Kenya's best upcoming artist?",
      category: "Music",
      pollType: "community",
      creatorTypeChargeMinor: 0,
      voterPriceMinor: null,
      votingPolicy: "open" as const,
      options: ["Bien", "Nviiri the Storyteller", "Femi One"],
    },
    {
      id: "10000000-0000-4000-8000-000000000002",
      title: "Best Kenyan football club of the season?",
      category: "Sports",
      pollType: "featured",
      creatorTypeChargeMinor: 10000,
      voterPriceMinor: null,
      votingPolicy: "account_limited" as const,
      options: ["Gor Mahia", "AFC Leopards", "Tusker FC"],
    },
    {
      id: "10000000-0000-4000-8000-000000000003",
      title: "Nairobi's best brunch spot?",
      category: "Food",
      pollType: "community",
      creatorTypeChargeMinor: 0,
      voterPriceMinor: 1000,
      votingPolicy: "open" as const,
      options: ["The Social House", "About Thyme", "Talisman"],
    },
  ];

  for (const seedPoll of seedPolls) {
    const { options, ...poll } = seedPoll;
    const [saved] = await db
      .insert(polls)
      .values({
        ...poll,
        creatorId: creator.id,
        status: "published",
        resultVisibility: "public",
        isFeatured: poll.pollType === "featured",
      })
      .onConflictDoNothing({ target: polls.id })
      .returning({ id: polls.id });
    const pollId = saved?.id ?? poll.id;
    await db
      .insert(pollOptions)
      .values(options.map((label, position) => ({ pollId, label, position })))
      .onConflictDoNothing();
  }

  console.log(`Seeded ${seedPolls.length} demo polls for ${creator.id}`);
} finally {
  await client.end();
}
