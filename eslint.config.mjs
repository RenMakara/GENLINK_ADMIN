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

/**
 * `toLocaleString()` and friends render in the *browser's* timezone, so a dashboard disagrees
 * with itself depending on who is looking — and it is invisible when reviewed from Phnom Penh,
 * where the two agree (SSOT §9.5). Verified: with the pinning removed, the date suite passes
 * 24/24 on a Cambodian machine and fails 9 assertions from New York.
 */
const NO_LOCAL_TIMEZONE = {
  selector: "CallExpression[callee.property.name=/^toLocale(Date|Time)?String$/]",
  message:
    "Use the Asia/Phnom_Penh formatter in lib/utils/date.ts. toLocaleString() uses " +
    "the browser's timezone (SSOT §9.5).",
};

/**
 * The same bug by the other route. `new Intl.DateTimeFormat(locale, {...})` with no `timeZone`
 * option silently uses the machine's zone, and unlike `toLocaleString` it *looks* deliberate —
 * which makes it likelier to survive review, not less.
 */
const NO_RAW_INTL_DATE = ["NewExpression", "CallExpression"].map((kind) => ({
  selector: `${kind}[callee.object.name='Intl'][callee.property.name='DateTimeFormat']`,
  message:
    "Construct date formatters in lib/utils/date.ts, which pins timeZone. A bare " +
    "Intl.DateTimeFormat uses the machine's timezone (SSOT §9.5).",
}));

/**
 * Web storage is readable by any script on the page, so a token in it is a token an XSS walks
 * away with — one carrying `user:delete` (SSOT §10.9, ADM-035 AC#1).
 *
 * <p>The access token lives in a ref and the refresh token in an `httpOnly` cookie. Neither is
 * a rule anyone can see at the point where a "just cache it for a second" would be written, so
 * the rule is here instead. `hooks/use-sidebar-state.ts` is exempted below — a collapsed
 * sidebar is not a credential.
 */
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

/**
 * An inline key cannot be invalidated by anything that does not repeat the same literal.
 * Banning a user has to refresh the list, the detail and the enforcement timeline; with
 * scattered literals, a missed one shows the moderator stale data straight after they acted.
 */
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
        NO_LOCAL_TIMEZONE,
        ...NO_RAW_INTL_DATE,
        ...NO_WEB_STORAGE,
        NO_INLINE_QUERY_KEY,
      ],
    },
  },

  {
    /**
     * The one file allowed to touch web storage.
     *
     * <p>Sidebar collapse is a display preference, not a credential. Exempted narrowly rather
     * than by a blanket disable, so the next use of storage in this file is still caught.
     */
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
    /**
     * The one file allowed to build a date formatter — it is what the rule above points at.
     *
     * <p>Flat config replaces a rule's options rather than merging them, so the two rules that
     * still apply here are restated. Narrowing an exemption to a single file beats adding a
     * blanket `eslint-disable`, which would also silence the next mistake in it.
     */
    files: ["lib/utils/date.ts"],
    rules: {
      "no-restricted-syntax": ["error", NO_LOCAL_TIMEZONE, ...NO_WEB_STORAGE, NO_INLINE_QUERY_KEY],
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
