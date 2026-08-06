import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Feature directories, read at config load rather than hard-coded.
 *
 * Adding `features/roles/` is then enough for the boundary to cover it — a list maintained by
 * hand would be correct on the day it was written and quietly wrong a month later, which for
 * a rule like this is worse than having none.
 */
function featureNames() {
  try {
    return readdirSync(join(here, "features"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

/**
 * How deeply a file can sit inside a feature and still climb out with `../`.
 *
 * `features/users/dialogs/ban-dialog.tsx` needs two hops to reach `features/`; three covers
 * anything realistic. This exists because `no-restricted-imports` globs the *specifier
 * string*, not the resolved path — it cannot tell that `../beta/thing` leaves the feature, so
 * the escape routes are enumerated instead.
 */
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

/**
 * One config block per feature: inside `features/x/**`, reaching into any *other* feature is
 * an error, by alias or by relative path. `features/x` importing its own files stays legal.
 */
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

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    // `process.env` belongs in one place, so the domain-agnostic rule (SSOT §1.7) is
    // enforceable rather than aspirational: no hostname, IP, port or scheme in code.
    files: ["**/*.{ts,tsx}"],
    // Exactly one application file may read process.env (SSOT §1.7). The others are outside
    // the app: build config, and standalone node scripts that never reach the browser.
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
        {
          // Renders in the *browser's* timezone, so a dashboard disagrees with itself
          // depending on who is looking — and it is invisible when reviewed from Phnom Penh,
          // where the two agree (SSOT §9.5).
          selector:
            "CallExpression[callee.property.name=/^toLocale(Date|Time)?String$/]",
          message:
            "Use the Asia/Phnom_Penh formatter in lib/utils/date.ts. toLocaleString() uses " +
            "the browser's timezone (SSOT §9.5).",
        },
      ],
    },
  },

  ...featureBoundaries,

  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
