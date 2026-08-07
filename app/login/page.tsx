import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Sign-in placeholder.
 *
 * <p>Outside the `(dashboard)` route group on purpose: the guard redirects here, so a guarded
 * sign-in page would bounce forever.
 *
 * <p>The real password → TOTP flow is ADM-036, which calls `signIn(challengeToken, code)` from
 * the auth provider. This exists so the guard has somewhere to send people in the meantime.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>GenLink KH · Admin</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          The sign-in form is built in <span className="font-mono">ADM-036</span>. The session
          plumbing behind it — challenge token, TOTP exchange, refresh cookie — is already in
          place.
        </CardContent>
      </Card>
    </main>
  );
}
