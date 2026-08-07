import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

import { env, isDevelopment, serverEnv } from "./lib/config/env";

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

  /**
   * Sends `/` to the portal.
   *
   * <p>With a basePath the app does not own `/` at all, so `pnpm dev` and a bare visit to the
   * host both land on a 404 — correct, but it reads as a broken build every time someone
   * forgets. `basePath: false` is required or the rule itself would be prefixed and never
   * match.
   *
   * <p>Only registered when a basePath is actually set: with an empty basePath the source and
   * destination would both be `/` and the redirect would loop forever.
   *
   * <p>In production nginx only routes `/admin` to this app, so this never fires there. It is
   * a development convenience, and harmless outside development.
   */
  /**
   * Development-only proxy from `/api/v1/**` to the Spring API.
   *
   * <p>`NEXT_PUBLIC_API_BASE_URL` is a *relative* path because, in production, nginx serves the
   * portal and the API from one origin (SSOT §1.7) — which is what removes CORS from the MVP.
   * In development there is no nginx: the portal is on :3000 and Spring on :8888, so that same
   * relative path resolves to Next and answers 404.
   *
   * <p>This rewrite makes development behave the way production does, so the API base URL stays
   * relative in both and no code branches on environment. It is registered **only** in
   * development — in production nginx does this, and a second proxy in front of it would add a
   * hop for nothing.
   *
   * <p>`basePath: false` because the client builds `/api/v1/...` from the origin root, not from
   * under `/admin`; prefixing the rule would mean it never matched.
   */
  async rewrites() {
    if (!isDevelopment) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${serverEnv().ADMIN_API_ORIGIN}/api/v1/:path*`,
        basePath: false,
      },
    ];
  },

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

// Points next-intl at i18n/request.ts. Without the plugin the config file is never
// loaded and every translation silently falls back to its key.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
