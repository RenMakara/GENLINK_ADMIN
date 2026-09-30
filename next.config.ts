import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

import { env, isDevelopment, serverEnv } from "./lib/config/env";

const nextConfig: NextConfig = {
  /** Serves the portal under the configured path, such as `/admin`. */
  basePath: env.NEXT_PUBLIC_BASE_PATH || undefined,

  /** Proxies API requests to Spring using the configured server origin. */
  async rewrites() {
    const apiOrigin = serverEnv().ADMIN_API_ORIGIN;
    if (!isDevelopment && apiOrigin === "http://localhost:8888") return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`,
        basePath: false,
      },
    ];
  },

  /** Lets the development MSW worker intercept API requests outside the portal base path. */
  async headers() {
    if (!isDevelopment) return [];
    return [
      {
        source: "/mockServiceWorker.js",
        headers: [{ key: "Service-Worker-Allowed", value: "/" }],
      },
    ];
  },

  /** Redirects root visits to the configured portal path. */
  async redirects() {
    if (!env.NEXT_PUBLIC_BASE_PATH) return [];
    return [
      {
        source: "/",
        destination: env.NEXT_PUBLIC_BASE_PATH,
        basePath: false,
        permanent: false,
      },
    ];
  },
};

// Load translations from i18n/request.ts.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
