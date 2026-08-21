import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@permguard/diff": fileURLToPath(
        new URL("packages/diff/src/index.ts", import.meta.url),
      ),
      "@permguard/reporter": fileURLToPath(
        new URL("packages/reporter/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    coverage: { reporter: ["text", "html"] },
    include: ["packages/**/*.test.ts", "packages/**/*.test.tsx"],
  },
});
