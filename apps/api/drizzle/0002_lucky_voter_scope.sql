ALTER TABLE "votes" ADD COLUMN "voter_unique" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "votes" SET "voter_unique" = true FROM "polls" WHERE "polls"."id" = "votes"."poll_id" AND "polls"."voting_policy" = 'account_limited';--> statement-breakpoint
DROP INDEX "votes_poll_voter_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "votes_poll_voter_unique" ON "votes" USING btree ("poll_id","voter_id") WHERE "votes"."voter_id" IS NOT NULL AND "votes"."voter_unique";
