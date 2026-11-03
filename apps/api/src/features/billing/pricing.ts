import { HttpError } from "../../shared/errors.js";

export type ChargePurpose = "creator_poll_type" | "voter_poll";

export function calculateChargeAmount(
  poll: { creatorTypeChargeMinor: number; voterPriceMinor: number | null },
  purpose: ChargePurpose,
) {
  const amountMinor =
    purpose === "creator_poll_type"
      ? poll.creatorTypeChargeMinor
      : poll.voterPriceMinor;
  if (amountMinor === null || amountMinor <= 0) {
    throw new HttpError(
      409,
      "NO_CHARGE_DUE",
      "This poll has no charge for that payment purpose",
    );
  }
  return amountMinor;
}
