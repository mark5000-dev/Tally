import { z } from "zod";

export const registerSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(2).max(80),
});

export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
});

export const emailTokenSchema = z.object({
  token: z.string().min(32).max(256),
});
export const passwordResetRequestSchema = z.object({
  email: z.email().max(254),
});
export const passwordResetSchema = emailTokenSchema.extend({
  password: z.string().min(12).max(128),
});
