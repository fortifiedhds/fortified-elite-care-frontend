import { siteDestination, siteOrigins, surfaceForOrigin } from "./routes";
import type { SiteOrigins } from "./routes";

export function currentSurface() {
  return surfaceForOrigin(window.location.origin, siteOrigins(import.meta.env));
}

export function siteHref(site: keyof SiteOrigins, path: string) {
  return siteDestination(
    site,
    path,
    window.location.origin,
    siteOrigins(import.meta.env),
  );
}
