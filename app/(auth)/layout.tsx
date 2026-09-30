import type { ReactNode } from "react";

/** Public sign-in and enrolment routes, without the dashboard shell. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/30 flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      {children}
      <p className="text-muted-foreground text-xs">GenLink KH · Admin</p>
    </div>
  );
}
