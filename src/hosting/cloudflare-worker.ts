import {
  isAppRoute,
  siteOrigins,
  surfaceForOrigin,
} from "../shared/lib/routes";
import type { SiteOrigins } from "../shared/lib/routes";

declare const __FEC_SITE_ENV__: Record<string, string>;
type Assets = { fetch(request: Request): Promise<Response> };

export async function serveFrontend(
  request: Request,
  assets: Assets,
  origins: SiteOrigins,
) {
  if (!["GET", "HEAD"].includes(request.method))
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  const url = new URL(request.url);
  const surface = surfaceForOrigin(url.origin, origins);
  const valid = isAppRoute(url.pathname, surface);
  const staticAsset =
    /\.[a-zA-Z0-9]+$/.test(url.pathname) && !/\.html?$/i.test(url.pathname);
  if (!valid && staticAsset) return assets.fetch(request);
  const asset = await assets.fetch(
    new Request(new URL("/", url), { method: "GET" }),
  );
  const headers = new Headers(asset.headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return new Response(request.method === "HEAD" ? null : asset.body, {
    status: asset.ok ? (valid ? 200 : 404) : asset.status,
    headers,
  });
}

export default {
  fetch(request: Request, env: { ASSETS: Assets }) {
    return serveFrontend(request, env.ASSETS, siteOrigins(__FEC_SITE_ENV__));
  },
};
