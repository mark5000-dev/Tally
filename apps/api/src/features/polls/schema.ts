import { z } from "zod";

const pollType = z.enum(["community", "featured"]);
const votingPolicy = z.enum(["open", "account_limited"]);
const resultVisibility = z.enum(["public", "after_vote", "after_close"]);
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

// Deliberately default-free. Zod applies an inner `.default()` even through an
// outer `.optional()`, so `.partial()` over a defaulted field still substitutes
// that default for an absent key. Keeping the defaults out of the shared shape
// stops a partial update from silently resetting columns the caller never sent.
// Creation applies them explicitly below.
const pollFieldsSchema = z.object({
  title: z.string().trim().min(8).max(240),
  description: z.string().trim().max(4000).nullable().optional(),
  category: z.string().trim().min(2).max(50),
  options: optionsSchema,
  pollType,
  votingPolicy,
  voterPriceMinor: z.number().int().positive().nullable().optional(),
  creatorShareBasisPoints: z
    .number()
    .int()
    .min(0)
    .max(10000)
    .nullable()
    .optional(),
  resultVisibility,
  startsAt: z.iso.datetime().nullable().optional(),
  endsAt: z.iso.datetime().nullable().optional(),
});

// Compare as instants, not as strings. `z.iso.datetime()` also accepts offset
// forms like "+03:00", and those do not sort chronologically against a "Z"
// timestamp when compared lexicographically.
const validTimeRange = (input: {
  startsAt?: string | null;
  endsAt?: string | null;
}) =>
  !input.startsAt ||
  !input.endsAt ||
  new Date(input.startsAt).getTime() < new Date(input.endsAt).getTime();

export const createPollSchema = pollFieldsSchema
  .extend({
    pollType: pollType.default("community"),
    votingPolicy: votingPolicy.default("open"),
    resultVisibility: resultVisibility.default("public"),
  })
  .refine(validTimeRange, {
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
  sort: z.enum(["recent", "ending_soon"]).default("recent"),
  status: z.enum(["published", "closed"]).default("published"),
});
export const myPollListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(["draft", "published", "closed", "removed"]).optional(),
});
export const pollIdSchema = z.string().uuid();
export const reportSchema = z.object({
  reason: z.enum(["spam", "harmful_content", "misinformation", "other"]),
  details: z.string().trim().max(2000).optional(),
});
