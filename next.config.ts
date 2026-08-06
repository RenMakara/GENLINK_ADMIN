import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

import { env } from "./lib/config/env";

const nextConfig: NextConfig = {
  /**
   * The portal is served under a path rather than its own host (SSOT §1.7): one nginx origin
   * for both the portal and the API, which removes CORS from the MVP entirely and makes the
   * eventual subdomain split a widening of a working configuration.
   *
   * Read from the validated config rather than written literally, so the default lives in one
   * place. Empty string means "serve at the root", which is what the subdomain deployment
   * will set.
   */
  basePath: env.NEXT_PUBLIC_BASE_PATH || undefined,
};

// Points next-intl at i18n/request.ts. Without the plugin the config file is never
// loaded and every translation silently falls back to its key.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
