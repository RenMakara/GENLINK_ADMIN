import { z } from "zod";

/** Shared Zod schemas for sign-in forms. */

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Enter your email address")
    .email("That does not look like an email address"),
  /** Check presence only so valid legacy passwords remain accepted. */
  password: z.string().min(1, "Enter your password"),
});

export type LoginValues = z.infer<typeof loginSchema>;

/** Accepts either a TOTP or recovery code; the server validates it. */
export const mfaSchema = z.object({
  code: z
    .string()
    .min(1, "Enter the code from your authenticator")
    .refine(
      (value) => {
        const cleaned = value.replace(/[\s-]/g, "");
        return /^\d{6}$/.test(cleaned) || /^[A-Za-z0-9]{10}$/.test(cleaned);
      },
      "Enter a 6-digit code, or one of your recovery codes",
    ),
});

export type MfaValues = z.infer<typeof mfaSchema>;

/** Strips spacing so `123 456` and `ABCDE-FGHJK` both reach the server in the shape it expects. */
export function normaliseCode(value: string): string {
  return value.replace(/\s/g, "").toUpperCase();
}
