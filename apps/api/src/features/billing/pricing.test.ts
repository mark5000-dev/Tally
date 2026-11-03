import assert from "node:assert/strict";
import test from "node:test";
import { calculateChargeAmount } from "./pricing.js";

test("billing calculates the creator type charge from server poll data", () => {
  assert.equal(
    calculateChargeAmount(
      { creatorTypeChargeMinor: 12500, voterPriceMinor: 700 },
      "creator_poll_type",
    ),
    12500,
  );
});

test("billing calculates voter price separately from creator charge", () => {
  assert.equal(
    calculateChargeAmount(
      { creatorTypeChargeMinor: 12500, voterPriceMinor: 700 },
      "voter_poll",
    ),
    700,
  );
});

test("billing rejects payment intents for free purposes", () => {
  assert.throws(
    () =>
      calculateChargeAmount(
        { creatorTypeChargeMinor: 0, voterPriceMinor: null },
        "creator_poll_type",
      ),
    { code: "NO_CHARGE_DUE" },
  );
});
