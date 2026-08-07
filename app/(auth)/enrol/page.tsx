import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnrolFlow } from "@/features/auth/enrol-flow";

export const metadata = { title: "Set up two-factor authentication · GenLink KH Admin" };

/**
 * Forced enrolment on first sign-in (SSOT §10.8).
 *
 * <p>Reached when the password step reports `enrolmentRequired`. Two-factor is mandatory for
 * every admin and not configurable: an admin panel without it is a credential-stuffing target
 * with a total blast radius.
 */
export default function EnrolPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set up two-factor authentication</CardTitle>
        <CardDescription>
          Required for every administrator. You will need an authenticator app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EnrolFlow />
      </CardContent>
    </Card>
  );
}
