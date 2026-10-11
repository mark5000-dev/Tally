import { z } from "zod";

export const createPaymentIntentSchema = z.object({
  purpose: z.enum(["creator_poll_type", "voter_poll"]),
  pollId: z.string().uuid(),
});
export const idempotencySchema = z.uuid();
