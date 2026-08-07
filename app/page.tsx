import { redirect } from "next/navigation";

/**
 * The portal has no content of its own at the root.
 *
 * <p>Redirects to the dashboard, which is the first thing in the sidebar and the only sensible
 * landing page for a signed-in admin. Once ADM-035 adds the auth guard, an unauthenticated
 * visitor bounces from there to sign-in rather than needing a second rule here.
 */
export default function RootPage() {
  redirect("/dashboard");
}
