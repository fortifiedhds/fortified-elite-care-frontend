import { copyFile } from "node:fs/promises";
import { build, loadEnv } from "vite";

const mode = "production";
const env = loadEnv(mode, process.cwd(), "VITE_");
const siteEnvironment = Object.fromEntries(
  ["VITE_PUBLIC_ORIGIN", "VITE_DASHBOARD_ORIGIN", "VITE_ADMIN_ORIGIN"].map(
    (key) => [key, env[key] || ""],
  ),
);

await copyFile("dist/index.html", "dist/404.html");
await build({
  configFile: false,
  mode,
  publicDir: false,
  define: { __FEC_SITE_ENV__: JSON.stringify(siteEnvironment) },
  ssr: { target: "webworker", noExternal: true },
  build: {
    ssr: "src/hosting/cloudflare-worker.ts",
    outDir: "dist",
    emptyOutDir: false,
    minify: true,
    rollupOptions: { output: { entryFileNames: "_worker.js" } },
  },
});
