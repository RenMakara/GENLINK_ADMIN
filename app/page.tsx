import type { Metadata } from "next";

import { AdminLandingPage } from "@/features/landing/admin-landing-page";

/**
 * Public GenLink introduction page. The staff portal remains protected under `/dashboard`, while
 * the root is intentionally useful to unauthenticated visitors who discover the Admin host.
 */
export const metadata: Metadata = {
  title: "GenLink KH — Grow together",
  description:
    "GenLink brings learning, community, finance, and opportunity into one place for Cambodia's next generation.",
};

export default function RootPage() {
  return <AdminLandingPage />;
}
