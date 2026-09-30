import type { Metadata } from "next";

import { AdminLandingPage } from "@/features/landing/admin-landing-page";

/** Public introduction page; staff tools remain under `/dashboard`. */
export const metadata: Metadata = {
  title: "GenLink KH — Grow together",
  description:
    "GenLink brings learning, community, finance, and opportunity into one place for Cambodia's next generation.",
};

export default function RootPage() {
  return <AdminLandingPage />;
}
