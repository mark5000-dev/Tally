import { z } from "zod";

export const castVoteSchema = z.object({ optionId: z.string().uuid() });
export const idempotencyKeySchema = z.uuid();
