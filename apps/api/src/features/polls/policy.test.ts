import assert from "node:assert/strict";
import test from "node:test";
import { canViewResults } from "./policy.js";

test("public results are always visible", () => {
  assert.equal(
    canViewResults({
      visibility: "public",
      status: "published",
      viewerHasVoted: false,
    }),
    true,
  );
});

test("after-vote results are only visible to voters", () => {
  assert.equal(
    canViewResults({
      visibility: "after_vote",
      status: "published",
      viewerHasVoted: false,
    }),
    false,
  );
  assert.equal(
    canViewResults({
      visibility: "after_vote",
      status: "published",
      viewerHasVoted: true,
    }),
    true,
  );
});

test("after-close results are only visible after poll closure", () => {
  assert.equal(
    canViewResults({
      visibility: "after_close",
      status: "published",
      viewerHasVoted: true,
    }),
    false,
  );
  assert.equal(
    canViewResults({
      visibility: "after_close",
      status: "closed",
      viewerHasVoted: false,
    }),
    true,
  );
});
