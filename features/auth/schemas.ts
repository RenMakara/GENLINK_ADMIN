import { z } from "zod";

/**
 * The single source of truth for sign-in validation (SSOT §11.6).
 *
 * <p>Zod rather than hand-written checks so the rule and the type come from one declaration —
 * a form field and its validator cannot drift apart if only one of them exists.
 */

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Enter your email address")
    .email("That does not look like an email address"),
  /**
   * Presence only. No length or complexity rule on a sign-in form: the password either matches
   * what is stored or it does not, and a client-side minimum would reject a correct legacy
   * password before it was ever tried. Strength rules belong at registration.
   */
  password: z.string().min(1, "Enter your password"),
});

export type LoginValues = z.infer<typeof loginSchema>;

/**
 * A TOTP code or a recovery code.
 *
 * <p>Both are accepted here because both are valid second factors (SSOT §10.8), and an admin
 * reaching for a recovery code has usually lost their phone — being told "must be 6 digits" at
 * that moment would be a small cruelty. The server decides which it is.
 */
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
