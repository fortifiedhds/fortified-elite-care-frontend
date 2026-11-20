# Domains and deployment

The same frontend build serves the public website, patient/doctor dashboard and administrator console. It chooses the route set from the current origin. Local and Vercel preview origins combine the screens for testing.

## MVP build environment

```dotenv
VITE_API_URL=https://api.fortifiedelitecare.com/api/v1
VITE_PUBLIC_ORIGIN=https://fortifiedelitecare.com
VITE_DASHBOARD_ORIGIN=https://dashboard.fortifiedelitecare.com
VITE_ADMIN_ORIGIN=https://admin.fortifiedelitecare.com
```

Vite reads these public values at build time. Rebuild when changing them. Provider secrets belong in the backend environment. The three origin defaults match the addresses above, and explicit VITE origin values can override them for another domain or a test setup.

For current local testing, keep VITE_API_URL=http://127.0.0.1:3000/api/v1. The combined local frontend keeps its public pages, auth screens, care portal and generated administrator console route.

## Host routes

| Host                             | Page behavior                                                                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fortifiedelitecare.com           | Public website pages, with sign-in and enrolment links opening the dashboard host                                                                          |
| dashboard.fortifiedelitecare.com | Root opens the portal session check, followed by the login or care dashboard. Login, registration, Google onboarding and known portal routes are available |
| admin.fortifiedelitecare.com     | Root returns 404. Known routes under /console-7c6e4b9f2a83 open administrator sign-in or the corresponding console page                                    |
| Local and preview hostnames      | Combined application for testing                                                                                                                           |

Administrator email verification uses /console-7c6e4b9f2a83/verify-email. Expired-code navigation returns to the console sign-in. The public /login, /register and /verify-email paths return 404 on the administrator host. The API's role and permission checks authorize all protected operations.

Website and brand links from a dashboard return to the public origin. A care account opened on the admin console has a link back to the care portal. An admin session opened on the dashboard is sent to the admin console. Cross-origin navigation loads the destination host.

## Build artifacts and HTTP status

Run npm run build with Node.js 24. It typechecks the application, builds the SPA, copies its shell to dist/404.html and bundles src/hosting/cloudflare-worker.ts as dist/_worker.js.

Cloudflare Pages uses this advanced-mode worker to select the route set before serving HTML. Known routes return 200. The admin root and unknown routes return 404 with the same React branded Page not found screen. HTML responses use Cache-Control=no-store. HEAD preserves status and headers with an empty body. Static files pass through ASSETS.

The router uses the same shared route inventory in src/shared/lib/routes.ts. Add new page patterns there along with the corresponding route or portal navigation. On Vercel, also update the explicit SPA rewrites in vercel.json. Unmatched paths use the generated 404.html and Vercel's 404 response.

On Cloudflare, the worker controls application page status. The old catch-all _redirects file has been removed so missing assets retain their 404 responses. Vercel uses vercel.json. Vite's local development and preview servers continue their normal SPA fallback, so HTTP status tests use the worker handler.

## Cloudflare Pages

Use the Vite frontend repository with npm run build and the dist output folder. Set Node.js 24 and the public build environment above. Add fortifiedelitecare.com, dashboard.fortifiedelitecare.com and admin.fortifiedelitecare.com as custom domains on the same Pages project. Backend origin and Google callback settings are documented in the sibling [backend guide](../../fortified-elite-care-backend/docs/domains-and-deployment.md).

The _worker.js artifact activates advanced mode and handles requests through the ASSETS binding. Its configuration includes frontend origins. Existing public/_headers and the worker response headers supply browser security headers. The current testing build's noindex settings can be reviewed when preparing the public MVP release.

## Verification

| Request                                                                    | Expected result on Cloudflare                 |
| -------------------------------------------------------------------------- | --------------------------------------------- |
| GET https://admin.fortifiedelitecare.com/                                  | 404, branded Page not found                   |
| GET https://admin.fortifiedelitecare.com/login                             | 404, branded Page not found                   |
| GET https://admin.fortifiedelitecare.com/console-7c6e4b9f2a83              | 200, administrator sign-in or console         |
| GET https://admin.fortifiedelitecare.com/console-7c6e4b9f2a83/verify-email | 200, browser-bound email verification         |
| GET https://admin.fortifiedelitecare.com/console-7c6e4b9f2a83/settings     | 200, authenticated settings after sign-in     |
| GET https://dashboard.fortifiedelitecare.com/login                         | 200, care sign-in with Google when configured |
| GET https://fortifiedelitecare.com/missing-page                            | 404, branded Page not found                   |
| GET https://admin.fortifiedelitecare.com/missing.png                       | 404, missing asset                            |

Automated tests exercise host isolation, links, route inventory, CORS, nested admin verification and worker HTTP status. A local browser check verifies the Google mark and authorization redirect. The OAuth provider session is completed by the user.

## References

- [Cloudflare Pages advanced mode](https://developers.cloudflare.com/pages/functions/advanced-mode/)
- [Cloudflare Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Vercel custom 404 pages](https://vercel.com/kb/guide/custom-404-page)
- [Google sign-in branding](https://developers.google.com/identity/branding-guidelines)
