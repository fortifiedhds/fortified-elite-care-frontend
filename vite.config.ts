import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    include: ["test/unit/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    pool: "threads",
    maxWorkers: 2,
    testTimeout: 20000,
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx", "src/shared/api/schema.ts", "**/types.ts"],
      reporter: ["text", "html"],
    },
  },
});
