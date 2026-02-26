import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
  },
  resolve: {
    alias: {
      "@mail-whale/types": new URL(
        "../../packages/types/src/index.ts",
        import.meta.url
      ).pathname,
    },
  },
});
