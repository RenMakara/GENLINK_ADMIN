import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Resolves the `@/` alias from tsconfig.json natively. Vite supports this directly now,
    // so vite-tsconfig-paths is not needed.
    tsconfigPaths: true,
  },
  test: {
    // Node, not jsdom: everything here is transport and mapping logic. Component tests
    // arrive with their own environment in Phase 2 (testing-plan.md).
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
