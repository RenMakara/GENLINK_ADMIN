import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MfaForm } from "@/features/auth/mfa-form";

export const metadata = { title: "Two-factor authentication · GenLink KH Admin" };

export default function MfaPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
        <CardDescription>
          Your password was accepted. One more step.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MfaForm />
      </CardContent>
    </Card>
  );
}
