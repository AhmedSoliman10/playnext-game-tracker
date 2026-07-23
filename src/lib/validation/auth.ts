import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254, "Email address is too long.");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "Use at least 6 characters.").max(128),
});

export const signUpSchema = signInSchema.extend({
  displayName: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters.")
    .max(32, "Display names can be at most 32 characters.")
    .regex(
      /^[a-zA-Z0-9 _.-]+$/,
      "Use letters, numbers, spaces, dots, dashes, or underscores.",
    ),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Use at least 6 characters.").max(128),
    confirmPassword: z.string().min(6, "Use at least 6 characters.").max(128),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters.")
    .max(32, "Display names can be at most 32 characters.")
    .regex(
      /^[a-zA-Z0-9 _.-]+$/,
      "Use letters, numbers, spaces, dots, dashes, or underscores.",
    ),
  avatarUrl: z.string().trim().url().nullable().optional().or(z.literal("")),
  isPrivate: z.boolean().optional().default(false),
});

export const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE", {
    error: "Type DELETE to confirm account deletion.",
  }),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
