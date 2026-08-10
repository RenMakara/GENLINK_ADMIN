"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthErrorAlert } from "@/features/auth/auth-error-alert";
import { useAuth } from "@/features/auth/auth-provider";
import { redirectsToEnrolment } from "@/features/auth/error-messages";
import { mfaSchema, normaliseCode, type MfaValues } from "@/features/auth/schemas";
import { returnToFrom } from "@/lib/auth/routes";

/**
 * The second factor (ADM-036).
 *
 * <p>Accepts a 6-digit TOTP code or a recovery code; the server decides which. On success the
 * session exists and the admin lands wherever they were headed — the dashboard, unless a guard
 * intercepted them on the way to somewhere else (ADM-039).
 */
export function MfaForm() {
  const { challenge, completeSignIn } = useAuth();
  const router = useRouter();
  const [errorCode, setErrorCode] = useState<string | null | undefined>(null);

  const form = useForm<MfaValues>({
    resolver: zodResolver(mfaSchema),
    defaultValues: { code: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // Reloading this page drops the in-memory challenge, which is intended — a half-finished
  // sign-in should not survive. Send them back rather than showing a form that cannot work.
  useEffect(() => {
    if (!challenge) {
      router.replace("/login");
    }
  }, [challenge, router]);

  const { isSubmitting } = form.formState;

  async function onSubmit(values: MfaValues) {
    setErrorCode(null);
    const result = await completeSignIn(normaliseCode(values.code));

    if (result.ok) {
      // Back to whatever they were trying to open when the guard intercepted them, or the
      // dashboard (ADM-039 AC#1). Re-validated here rather than trusted from `/login`: the value
      // travelled through a URL the visitor controls.
      router.replace(returnToFrom(window.location.search));
      return;
    }
    if (redirectsToEnrolment(result.errorCode)) {
      router.push("/enrol");
      return;
    }
    if (result.errorCode === "CHALLENGE_MISSING") {
      router.replace("/login");
      return;
    }
    setErrorCode(result.errorCode);
    // Clear the field on a rejection: the old code is certainly wrong by now, and leaving it
    // there invites a second submit of the same six digits.
    form.reset({ code: "" });
    form.setFocus("code");
  }

  if (!challenge) {
    return null;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <AuthErrorAlert errorCode={errorCode} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Authentication code</Label>
        <Input
          id="code"
          // Not type="number": it strips leading zeros, which a TOTP code can start with, and
          // it rejects recovery codes outright.
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          // 11 fits a formatted recovery code (ABCDE-FGHJK) as well as six digits.
          maxLength={11}
          aria-invalid={!!form.formState.errors.code}
          aria-describedby={form.formState.errors.code ? "code-error" : "code-hint"}
          className="text-center font-mono text-lg tracking-[0.3em]"
          {...form.register("code")}
        />
        {form.formState.errors.code ? (
          <p id="code-error" role="alert" className="text-destructive text-sm">
            {form.formState.errors.code.message}
          </p>
        ) : (
          <p id="code-hint" className="text-muted-foreground text-sm">
            Open your authenticator app, or use one of your recovery codes.
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? "Verifying…" : "Sign in"}
      </Button>

      {/*
        Five wrong codes void the challenge (SSOT §10.6), and the server then answers
        RATE_LIMITED rather than "wrong code" — so leaving is genuinely the way out.
      */}
      <Button type="button" variant="ghost" onClick={() => router.replace("/login")}>
        Start again
      </Button>
    </form>
  );
}
