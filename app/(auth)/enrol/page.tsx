import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnrolFlow } from "@/features/auth/enrol-flow";

export const metadata = { title: "Set up two-factor authentication · GenLink KH Admin" };

/** Requires TOTP enrolment before an admin can continue sign-in. */
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
