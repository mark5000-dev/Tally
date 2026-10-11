import assert from "node:assert/strict";
import test from "node:test";
import { createPollSchema, pollListQuerySchema } from "./schema.js";

const validPoll = {
  title: "Which option should we choose?",
  category: "Community",
  options: ["First choice", "Second choice"],
};

test("poll creation defaults poll type and voting rules", () => {
  const result = createPollSchema.parse(validPoll);
  assert.equal(result.pollType, "community");
  assert.equal(result.votingPolicy, "open");
  assert.equal(result.resultVisibility, "public");
});

test("poll creation rejects duplicate options and invalid time ranges", () => {
  assert.equal(
    createPollSchema.safeParse({ ...validPoll, options: ["Same", "same"] })
      .success,
    false,
  );
  assert.equal(
    createPollSchema.safeParse({
      ...validPoll,
      startsAt: "2026-10-03T10:00:00Z",
      endsAt: "2026-10-02T10:00:00Z",
    }).success,
    false,
  );
});

test("public poll listing bounds page size", () => {
  assert.equal(
    pollListQuerySchema.safeParse({ page: "1", limit: "100" }).success,
    true,
  );
  assert.equal(pollListQuerySchema.safeParse({ limit: "1000" }).success, false);
});
