import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import hosting from "./vercel.json" with { type: "json" };
const proxyTarget = hosting.rewrites
  .find((route) => route.source === "/api/v1/:path*")
  ?.destination.replace(/\/:path\*$/, "");
if (!proxyTarget)
  throw new Error("The Vercel API proxy target must be configured.");

export default defineConfig({
  define: { __FEC_VERCEL_API_TARGET__: JSON.stringify(proxyTarget) },
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
