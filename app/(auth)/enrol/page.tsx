import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Enrolment placeholder.
 *
 * <p>Reached when an admin has never confirmed TOTP — sign-in is impossible until they do
 * (SSOT §10.8). The QR code, secret and recovery codes are <span>ADM-037</span>; the backend
 * routes behind them already exist.
 */
export default function EnrolPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Set up two-factor authentication</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        This screen is built in <span className="font-mono">ADM-037</span>. Until then, enrol
        with <span className="font-mono">scripts/dev-admin-mfa.sh</span> and sign in again.
      </CardContent>
    </Card>
  );
}
