# First-party authentication on Vercel

## Problem and deployed fix

The previous browser called the Render API directly from the Vercel website. On iPhone, the observed logs showed a fresh anonymous seed being issued, then a login with its token but no cookie header (`COOKIE_MISSING`). `Secure` and `SameSite=None` were already configured. Those attributes do not override browser restrictions on third-party cookies.

On `*.vercel.app`, when `VITE_API_URL` matches the configured Render upstream, the browser now calls its own origin at `/api/v1`. `vercel.json` forwards that prefix to the Render backend before considering SPA routes. Render still handles authentication, CSRF, role checks, validation, storage and the database. There is no frontend session store and no token in local storage.

The proxy is an external rewrite, with a fixed destination and no user-selected upstream. It preserves method, body, query, request cookies and response `Set-Cookie` headers. It covers every API path, including login, registration, verification, recovery, multipart certificate uploads, downloads and sign-out. A Vercel Function or middleware does not read the upload body. API 4xx/5xx responses remain API responses rather than the SPA shell.

`vite.config.ts` reads the upstream from `vercel.json` into a public build constant. `shared/api/base-url.ts` compares it with the configured API and current browser host. This keeps the infrastructure target in one place. The Vercel build's existing `VITE_API_URL=https://fortified-elite-care-backend.onrender.com/api/v1` can stay as configured. If moving to another Render service, update the rewrite destination and that environment value together, then rebuild. Local development and the future Cloudflare build using `https://api.fortifiedelitecare.com/api/v1` retain their configured API base.

## Google callback

The Google start request also passes through the frontend proxy, so its random state cookie belongs to the frontend host. Google may still return to the existing registered Render callback. If that first callback has no matching state cookie, the backend returns the untouched code and state to the configured `WEB_ORIGIN/api/v1/auth/google/callback`, with `_fec_relay=1`. The frontend proxy then delivers the callback together with the first-party state cookie.

Only then does the normal Google service validate the state cookie, one-use database attempt, PKCE verifier, ID token and nonce. Code exchange retains the original configured `GOOGLE_REDIRECT_URI`, which must match the URI used for authorization. New-user onboarding, email linking and returning-user sessions all issue their cookies through the frontend host. A callback with no cookie after the relay fails normally; it cannot loop or create a session. Relay URLs come only from configured `WEB_ORIGIN`, never a caller-supplied host or return URL. Responses are no-store with no-referrer policy. Codes and state are not logged.

No new Google Cloud redirect URI, Render variable, database migration or secret is required for the current testing deployment. Keep `WEB_ORIGIN` set to the actual Vercel website, the existing Google callback, and production Secure cookie settings. The relay is limited to a configured Vercel frontend and skips callbacks that already carry the matching state cookie. The shared-domain MVP flow continues to use its configured callback normally.

## Release and verification

1. Deploy the backend first so the Google callback relay is ready.
2. Deploy the frontend with the new API rewrite and regenerated build. Refresh existing tabs so they use the new API base. Existing Render-host sessions are not copied to the frontend host; sign in once again.
3. In Network, a Vercel login should request `https://<frontend>/api/v1/auth/csrf` and `.../auth/login`. The next request must carry the anonymous seed cookie. Successful login sets a host-only HttpOnly session cookie on the frontend host.
4. With third-party cookies blocked, check password sign-in, admin OTP, refresh, sign-out, recovery, Google onboarding and returning Google sign-in. Missing cookie/token checks remain enforced. No automatic mutation retries or extra background polling are introduced.

The configured backend Origin allowlist still applies. An arbitrary preview hostname is not implicitly trusted: set approved frontend origins for the environment being tested. Unknown app pages retain their existing 404 handling.

Tests cover API-base selection, fixed rewrite configuration, Google callback relaying and loop prevention, original redirect/PKCE/nonce verification, replay denial, real HTTP session creation and blocked-third-party-cookie browser scenarios.

References: [MDN third-party cookies](https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/Third-party_cookies), [Vercel external rewrites](https://vercel.com/docs/routing/rewrites).
