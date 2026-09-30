"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthErrorAlert } from "@/features/auth/auth-error-alert";
import { beginEnrolment, confirmEnrolment, type EnrolmentSetup } from "@/features/auth/auth-client";
import { useAuth } from "@/features/auth/auth-provider";
import { QrCode } from "@/features/auth/qr-code";
import { RecoveryCodes } from "@/features/auth/recovery-codes";
import { mfaSchema, normaliseCode, type MfaValues } from "@/features/auth/schemas";

/** First-login TOTP setup, verification, and recovery-code flow. */
type Step = "intro" | "starting" | "setup" | "codes" | "failed";

/** Base32 in groups of four, because this is transcribed by hand into a phone. */
function groupSecret(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

export function EnrolFlow() {
  const { challenge } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("intro");
  const [setup, setSetup] = useState<EnrolmentSetup | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [errorCode, setErrorCode] = useState<string | null | undefined>(null);
  const [secretCopied, setSecretCopied] = useState(false);

  const form = useForm<MfaValues>({
    resolver: zodResolver(mfaSchema),
    defaultValues: { code: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // Reloading loses the in-memory challenge, which is intended — see AuthProvider. There is no
  // way to continue an enrolment without it, so send them back to the start.
  useEffect(() => {
    if (!challenge) {
      router.replace("/login");
    }
  }, [challenge, router]);

  /** Starts setup only after a click, so revisiting the page cannot replace a scanned secret. */
  const start = useCallback(async () => {
    if (!challenge) return;
    setStep("starting");
    const result = await beginEnrolment(challenge.token);
    if (!result.ok || !result.data) {
      setErrorCode(result.errorCode);
      setStep("failed");
      return;
    }
    setErrorCode(null);
    setSetup(result.data);
    setStep("setup");
  }, [challenge]);

  async function onSubmit(values: MfaValues) {
    if (!challenge) return;
    setErrorCode(null);
    const result = await confirmEnrolment(challenge.token, normaliseCode(values.code));

    if (!result.ok || !result.data) {
      setErrorCode(result.errorCode);
      form.reset({ code: "" });
      form.setFocus("code");
      return;
    }
    setCodes(result.data.recoveryCodes);
    setStep("codes");
  }

  async function copySecret() {
    if (!setup) return;
    try {
      await navigator.clipboard.writeText(setup.secret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    } catch {
      // The key is on screen and selectable; a failed copy is not worth an error state here.
    }
  }

  if (!challenge) {
    return null;
  }

  if (step === "intro" || step === "starting") {
    return (
      <div className="flex flex-col gap-4">
        <AuthErrorAlert errorCode={errorCode} />
        <p className="text-muted-foreground text-sm">
          You will need an authenticator app on your phone — Google Authenticator, Aegis, 1Password
          or any other. Have it open before you begin.
        </p>
        <Button type="button" onClick={() => void start()} disabled={step === "starting"}>
          {step === "starting" ? "Preparing…" : "Begin setup"}
        </Button>
      </div>
    );
  }

  if (step === "failed") {
    return (
      <div className="flex flex-col gap-4">
        <AuthErrorAlert errorCode={errorCode} />
        <Button type="button" variant="outline" onClick={() => router.replace("/login")}>
          Back to sign in
        </Button>
      </div>
    );
  }

  if (step === "codes" && codes) {
    return (
      <RecoveryCodes
        codes={codes}
        onAcknowledged={() => {
          // Dropped from memory the moment they are acknowledged, so nothing can render them a
          // second time (AC#4). They are hashed server-side and unrecoverable from here.
          setCodes(null);
          // Back to sign in rather than straight to the dashboard: the challenge is five
          // minutes old at most, and reading ten codes carefully takes longer than that. Being
          // asked to sign in with the authenticator just set up is also a useful proof that it
          // works.
          router.replace("/login");
        }}
      />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <AuthErrorAlert errorCode={errorCode} />

      <ol className="flex flex-col gap-5 text-sm">
        <li className="flex flex-col gap-3">
          <span className="font-medium">1. Scan this with your authenticator app</span>
          <div className="flex justify-center">
            {setup ? <QrCode value={setup.otpauthUri} /> : null}
          </div>
        </li>

        <li className="flex flex-col gap-2">
          <span className="font-medium">Or enter this key by hand</span>
          <p className="text-muted-foreground">
            Choose &ldquo;enter a setup key&rdquo; in your app, and pick <em>time-based</em>.
          </p>
          <div className="flex items-center gap-2">
            <code className="bg-muted flex-1 rounded-lg px-3 py-2 font-mono text-sm break-all">
              {setup ? groupSecret(setup.secret) : ""}
            </code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copySecret}
              aria-label="Copy setup key"
            >
              {secretCopied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            </Button>
          </div>
        </li>
      </ol>

      <div className="flex flex-col gap-2">
        <Label htmlFor="code">2. Enter the code your app shows</Label>
        <Input
          id="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={7}
          aria-invalid={!!form.formState.errors.code}
          aria-describedby={form.formState.errors.code ? "code-error" : undefined}
          className="text-center font-mono text-lg tracking-[0.3em]"
          {...form.register("code")}
        />
        {form.formState.errors.code ? (
          <p id="code-error" role="alert" className="text-destructive text-sm">
            {form.formState.errors.code.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Checking…" : "Turn on two-factor authentication"}
      </Button>
    </form>
  );
}
