declare const __FEC_VERCEL_API_TARGET__: string;
export const vercelApiTarget = __FEC_VERCEL_API_TARGET__;
export function resolveApiBase(
  configured: string | undefined,
  browserOrigin: string,
  proxyTarget = vercelApiTarget,
) {
  const browser = new URL(browserOrigin),
    api = new URL(configured || "http://127.0.0.1:3000/api/v1", browser);
  if (
    !["http:", "https:"].includes(api.protocol) ||
    api.username ||
    api.password ||
    api.search ||
    api.hash
  )
    throw new Error("The public API URL must be an HTTP(S) base URL.");
  const upstream = new URL(proxyTarget);
  const proxied =
    browser.hostname.endsWith(".vercel.app") &&
    api.origin === upstream.origin &&
    api.pathname.replace(/\/$/, "") === upstream.pathname.replace(/\/$/, "");
  return proxied ? browser.origin + "/api/v1" : api.href.replace(/\/$/, "");
}
