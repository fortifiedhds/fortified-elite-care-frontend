export const adminConsolePath = "/console-7c6e4b9f2a83";
export const adminVerificationPath = adminConsolePath + "/verify-email";

export type Surface = "combined" | "public" | "dashboard" | "admin";
export type SiteOrigins = { public: string; dashboard: string; admin: string };

export const defaultOrigins: SiteOrigins = {
  public: "https://fortifiedelitecare.com",
  dashboard: "https://dashboard.fortifiedelitecare.com",
  admin: "https://admin.fortifiedelitecare.com",
};

export const publicPages = [
  "about",
  "how-it-works",
  "services",
  "for-families",
  "for-doctors",
  "faq",
  "contact",
  "privacy",
  "terms",
] as const;

const authPaths = new Set([
  "/login",
  "/register",
  "/account-help",
  "/verify-email",
  "/google/onboarding",
]);
const portalPaths = new Set([
  "/portal",
  "/portal/checkups",
  "/portal/appointments",
  "/portal/history",
  "/portal/summaries",
  "/portal/registration",
  "/portal/baseline",
  "/portal/consent",
  "/portal/agreement",
  "/portal/payments",
  "/portal/available",
  "/portal/assigned",
  "/portal/notifications",
  "/portal/documents",
  "/portal/credentials",
  "/portal/settings",
]);
const adminPaths = new Set([
  "",
  "/verify-email",
  "/enrolments",
  "/visits",
  "/extra-requests",
  "/administrators",
  "/notifications",
  "/documents",
  "/settings",
]);

export function siteOrigins(env: Record<string, unknown>): SiteOrigins {
  const origins = { ...defaultOrigins };
  for (const [site, key] of Object.entries({
    public: "VITE_PUBLIC_ORIGIN",
    dashboard: "VITE_DASHBOARD_ORIGIN",
    admin: "VITE_ADMIN_ORIGIN",
  })) {
    const value = env[key];
    if (typeof value !== "string" || !value.trim()) continue;
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.origin !== url.href.slice(0, -1)
    )
      throw new Error(`${key} must be a single HTTP(S) origin.`);
    origins[site as keyof SiteOrigins] = url.origin;
  }
  return origins;
}

export function surfaceForOrigin(
  origin: string,
  origins: SiteOrigins,
): Surface {
  if (new Set(Object.values(origins)).size === 1) return "combined";
  if (origin === origins.admin) return "admin";
  if (origin === origins.dashboard) return "dashboard";
  if (origin === origins.public) return "public";
  return "combined";
}

export function siteDestination(
  site: keyof SiteOrigins,
  path: string,
  origin: string,
  origins: SiteOrigins,
) {
  return surfaceForOrigin(origin, origins) === "combined" ||
    origins[site] === origin
    ? path
    : origins[site] + path;
}

export function isAppRoute(pathname: string, surface: Surface) {
  const path = pathname.replace(/\/$/, "") || "/";
  const publicRoute =
    path === "/" || publicPages.some((page) => path === "/" + page);
  const careRoute =
    authPaths.has(path) ||
    portalPaths.has(path) ||
    /^\/portal\/(appointments|assigned)\/[^/]+$/.test(path) ||
    /^\/portal\/assigned\/[^/]+\/baseline$/.test(path);
  const adminPath = path.slice(adminConsolePath.length);
  const adminRoute =
    path.startsWith(adminConsolePath) &&
    (adminPaths.has(adminPath) ||
      /^\/enrolments\/[^/]+\/(review|credentials)$/.test(adminPath));
  if (surface === "public") return publicRoute;
  if (surface === "dashboard") return path === "/" || careRoute;
  if (surface === "admin") return adminRoute;
  return publicRoute || careRoute || adminRoute;
}
