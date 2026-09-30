import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const here = dirname(fileURLToPath(import.meta.url));

/** Lists feature folders for automatic boundary rules. */
function featureNames() {
  try {
    return readdirSync(join(here, "features"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

/** Maximum relative-import depth checked by feature boundaries. */
const MAX_FEATURE_DEPTH = 3;

/** `['../beta', '../beta/**', '../../beta', …]` — every relative way into `other`. */
function relativeEscapes(other) {
  const patterns = [];
  for (let depth = 1; depth <= MAX_FEATURE_DEPTH; depth++) {
    const up = "../".repeat(depth);
    patterns.push(`${up}${other}`, `${up}${other}/**`);
  }
  return patterns;
}

/** Prevents imports between feature folders. */
const featureBoundaries = featureNames().map((feature) => {
  const others = featureNames().filter((other) => other !== feature);
  return {
    files: [`features/${feature}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: others.map((other) => ({
            group: [
              `@/features/${other}`,
              `@/features/${other}/**`,
              ...relativeEscapes(other),
            ],
            message:
              `features/${feature} may not import from features/${other} (SSOT §12.1). ` +
              "If both need this, move it to components/, lib/, hooks/, services/, " +
              "types/ or schemas/.",
          })),
        },
      ],
    },
  };
});

/** Forbids date formatting that uses the browser's local timezone. */
const NO_LOCAL_TIMEZONE = {
  selector: "CallExpression[callee.property.name=/^toLocale(Date|Time)?String$/]",
  message:
    "Use the Asia/Phnom_Penh formatter in lib/utils/date.ts. toLocaleString() uses " +
    "the browser's timezone (SSOT §9.5).",
};

/** Forbids date formatters without an explicit timezone. */
const NO_RAW_INTL_DATE = ["NewExpression", "CallExpression"].map((kind) => ({
  selector: `${kind}[callee.object.name='Intl'][callee.property.name='DateTimeFormat']`,
  message:
    "Construct date formatters in lib/utils/date.ts, which pins timeZone. A bare " +
    "Intl.DateTimeFormat uses the machine's timezone (SSOT §9.5).",
}));

/** Prevents storing session credentials in browser storage. */
const NO_WEB_STORAGE = ["localStorage", "sessionStorage"].flatMap((store) => [
  {
    selector: `MemberExpression[object.name='${store}']`,
    message:
      `Do not use ${store}. The access token is held in memory and the refresh token in an ` +
      "httpOnly cookie, so an XSS cannot reach either (SSOT §10.9).",
  },
  {
    selector: `MemberExpression[object.property.name='${store}']`,
    message:
      `Do not use window.${store}. The access token is held in memory and the refresh token ` +
      "in an httpOnly cookie, so an XSS cannot reach either (SSOT §10.9).",
  },
]);

/** Requires query-key factories so mutation invalidation stays consistent. */
const NO_INLINE_QUERY_KEY = {
  selector: "Property[key.name='queryKey'] > ArrayExpression",
  message:
    "Build query keys with the factory in services/query-keys.ts, not an inline " +
    "array — otherwise invalidation after a mutation becomes guesswork (SSOT §12.1).",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    // Route app configuration through one validated module.
    files: ["**/*.{ts,tsx}"],
    // Build config and scripts run outside the browser app.
    ignores: ["lib/config/env.ts", "scripts/**", "*.config.{ts,mjs,js}"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message:
            "Read configuration through lib/config/env.ts, which validates it with Zod " +
            "(SSOT §1.7 / §12.1). Nothing else should touch process.env.",
        },
      ],
      "no-restricted-syntax": [
        "error",
        NO_LOCAL_TIMEZONE,
        ...NO_RAW_INTL_DATE,
        ...NO_WEB_STORAGE,
        NO_INLINE_QUERY_KEY,
      ],
    },
  },

  {
    /** Allow storage for non-sensitive table preferences only. */
    files: ["hooks/use-data-table-preferences.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        NO_LOCAL_TIMEZONE,
        ...NO_RAW_INTL_DATE,
        NO_INLINE_QUERY_KEY,
      ],
    },
  },

  {
    /** Allow storage for sidebar display preferences only. */
    files: ["hooks/use-sidebar-state.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        NO_LOCAL_TIMEZONE,
        ...NO_RAW_INTL_DATE,
        NO_INLINE_QUERY_KEY,
      ],
    },
  },

  {
    /** Allow centralized date formatters to specify the app timezone. */
    files: ["lib/utils/date.ts"],
    rules: {
      "no-restricted-syntax": ["error", NO_LOCAL_TIMEZONE, ...NO_WEB_STORAGE, NO_INLINE_QUERY_KEY],
    },
  },

  ...featureBoundaries,

  globalIgnores([
    // Standard Next.js build output.
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated by MSW; do not lint vendored code.
    "public/mockServiceWorker.js",
  ]),
]);

export default eslintConfig;
