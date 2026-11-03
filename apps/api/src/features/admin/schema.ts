import { z } from "zod";

export const reportReviewSchema = z.object({
  status: z.enum(["reviewed", "dismissed", "actioned"]),
  moderation: z.enum(["none", "close", "remove"]).default("none"),
  note: z.string().trim().max(1000).optional(),
});
export const pollModerationSchema = z.object({
  action: z.enum(["close", "remove", "restore"]),
  reason: z.string().trim().min(3).max(500),
});
