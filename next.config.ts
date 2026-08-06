import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Points next-intl at i18n/request.ts. Without the plugin the config file is never
// loaded and every translation silently falls back to its key.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
