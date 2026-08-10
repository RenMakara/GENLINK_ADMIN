import { GenLinkLogo } from "@/components/common";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/login-form";

export const metadata = { title: "Sign in · GenLink KH Admin" };

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="flex flex-col items-center text-center gap-2">
        <GenLinkLogo size="lg" suffix="Admin" />
        <CardTitle className="text-xl font-bold mt-1">Sign in</CardTitle>
        <CardDescription>Staff access to GenLink KH Portal.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
