"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthErrorAlert } from "@/features/auth/auth-error-alert";
import { useAuth } from "@/features/auth/auth-provider";
import { loginSchema, type LoginValues } from "@/features/auth/schemas";
import { returnToFrom, withReturnTo } from "@/lib/auth/routes";

/**
 * The password step (ADM-036).
 *
 * <p>A correct password does not sign anyone in — it buys a TOTP challenge. The page moves to
 * `/mfa`, or to enrolment when this admin has never set up an authenticator.
 */
export function LoginForm() {
  const { beginSignIn } = useAuth();
  const router = useRouter();
  const [errorCode, setErrorCode] = useState<string | null | undefined>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    // Validate on submit, then live. Marking a field invalid before the admin has finished
    // typing their address is noise; refusing to update after they fix it is worse.
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: LoginValues) {
    setErrorCode(null);
    const result = await beginSignIn(values.email, values.password);

    if (!result.ok) {
      setErrorCode(result.errorCode);
      return;
    }
    // Enrolment is forced on first sign-in (SSOT §10.8): the challenge is the only credential
    // an unenrolled admin holds, and it is what the enrolment routes accept.
    if (result.enrolmentRequired) {
      router.push("/enrol");
      return;
    }
    // Carry the destination across to the code step (ADM-039 AC#1). It has to travel in the URL
    // because that is the only thing surviving between two pages here — the challenge lives in
    // memory, but adding a field to it would tie a routing concern to a credential.
    router.push(withReturnTo("/mfa", returnToFrom(window.location.search)));
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <AuthErrorAlert errorCode={errorCode} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          autoFocus
          // Announced to assistive tech, and the message is tied to the field rather than
          // floating near it.
          aria-invalid={!!form.formState.errors.email}
          aria-describedby={form.formState.errors.email ? "email-error" : undefined}
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p id="email-error" role="alert" className="text-destructive text-sm">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!form.formState.errors.password}
          aria-describedby={form.formState.errors.password ? "password-error" : undefined}
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p id="password-error" role="alert" className="text-destructive text-sm">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>

      {/*
        Disabled while pending, which is what prevents a double submit (AC#4). A second
        password attempt counts towards the 5-failure lockout, so an impatient double-click
        must not spend two of them.
      */}
      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? "Checking…" : "Continue"}
      </Button>
    </form>
  );
}
