import { z } from "zod";

const pollType = z.enum(["community", "featured"]);
const optionsSchema = z
  .array(z.string().trim().min(1).max(120))
  .min(2)
  .max(20)
  .refine(
    (options) =>
      new Set(options.map((option) => option.toLocaleLowerCase())).size ===
      options.length,
    "Poll options must be unique",
  );

const pollFieldsSchema = z.object({
  title: z.string().trim().min(8).max(240),
  description: z.string().trim().max(4000).nullable().optional(),
  category: z.string().trim().min(2).max(50),
  options: optionsSchema,
  pollType: pollType.default("community"),
  votingPolicy: z.enum(["open", "account_limited"]).default("open"),
  voterPriceMinor: z.number().int().positive().nullable().optional(),
  creatorShareBasisPoints: z
    .number()
    .int()
    .min(0)
    .max(10000)
    .nullable()
    .optional(),
  resultVisibility: z
    .enum(["public", "after_vote", "after_close"])
    .default("public"),
  startsAt: z.iso.datetime().nullable().optional(),
  endsAt: z.iso.datetime().nullable().optional(),
});

const validTimeRange = (input: {
  startsAt?: string | null;
  endsAt?: string | null;
}) => !input.startsAt || !input.endsAt || input.startsAt < input.endsAt;

export const createPollSchema = pollFieldsSchema.refine(validTimeRange, {
  path: ["endsAt"],
  message: "Poll end time must be after its start time",
});

export const updatePollSchema = pollFieldsSchema
  .partial()
  .omit({ pollType: true })
  .refine(validTimeRange, {
    path: ["endsAt"],
    message: "Poll end time must be after its start time",
  });
export const pollListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(50).optional(),
  pollType: pollType.optional(),
  paid: z.enum(["true", "false"]).optional(),
  status: z.enum(["published", "closed"]).default("published"),
});
export const pollIdSchema = z.string().uuid();
export const reportSchema = z.object({
  reason: z.enum(["spam", "harmful_content", "misinformation", "other"]),
  details: z.string().trim().max(2000).optional(),
});
