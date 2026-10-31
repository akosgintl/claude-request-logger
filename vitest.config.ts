import { defineConfig } from "vitest/config";

// Separate from viewer/vite.config.ts so tests don't start the logs watcher.
export default defineConfig({
  test: { include: ["proxy/**/*.test.ts", "viewer/**/*.test.ts"] },
});
