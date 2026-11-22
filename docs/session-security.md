# Session security and expiry experience

FEC uses server-validated cookie sessions. Authentication guards and role, admin-permission and record-access checks run in the backend.

## HTTP transport

src/shared/api/security-fetch.ts supplies the shared API client's fetch and secureFetch for multipart uploads. Before each mutation it fetches /auth/csrf with credentials, then sends the returned session-bound proof in X-CSRF-Token. It does not cache proof across logins or automatically retry mutations. Anonymous registration, login, contact requests and authenticated writes use the same handshake. Bootstrap failure stops the write. Direct fetch mutations must use secureFetch.

X-Session-Expires-At and X-Session-Idle-Expires-At response headers update the shared session clock. A SESSION_EXPIRED response ends the signed-in UI; an ordinary incorrect OTP response does not. Browser state does not enforce or extend the server's expiry.

## Activity and warnings

Patients have 30-minute inactivity and 12-hour absolute limits. Doctors/admins have 15-minute inactivity and eight-hour absolute limits. The SessionSecurity component sends /auth/session/continue following real pointer, keyboard, scroll or touch interaction, at most once per minute. It does not generate background keepalives. The backend caps continuation at the original absolute expiry.

A two-minute warning gives a Stay signed in action for idle expiry. Absolute expiry asks the user to save and sign in again. The warning triggers draft-only saves in editable registration/assessment wizards and unsigned consultation notes. It never submits registrations, records consent, signs addenda or completes visits automatically.

## Draft recovery and privacy

DraftIdentity scopes memory to the authenticated account. Unsaved wizard answers, consent choices and consultation edits are held only in JavaScript memory for up to 30 minutes, with server-revision checks. Switching accounts or explicitly signing out clears the cache. A session-expiry sign-out retains it for the same account to recover after password sign-in in that tab. Returning to the form restores compatible edits.

No clinical fields are stored in browser localStorage/sessionStorage. Memory does not survive a reload, tab closure or external Google navigation. Server-saved drafts do. Browser suspension, validation failure or network errors can prevent automatic saving, so the warning does not promise every edit is already saved. Passwords and certificate file selections are never cached.

## Settings and sign-in return paths

Settings → Sign out all devices requests an email OTP. Confirmation calls /auth/sessions/revoke/confirm and signs out this device too. Cancellation leaves the session intact. The server rejects replayed, expired or other-session challenges. Other devices are rejected on their next protected request.

Admin review emails open an enrolment queue or a specific patient/doctor review. Password + OTP login preserves a validated local review return path. External URLs and unknown admin paths cannot be used as return destinations. Patient/doctor sign-in similarly accepts known portal routes for expiry recovery.

## Hosting and rollout

Deploy the backend migration and updated API, then the frontend. The previous browser bundle cannot send CSRF proof, so refresh after deployment. Existing users will need to sign in again once.

For the current Vercel/Render testing deployment, retain the backend's COOKIE_SAME_SITE=none and HTTPS. When MVP domains are ready:

    VITE_API_URL=https://api.fortifiedelitecare.com/api/v1
    VITE_PUBLIC_ORIGIN=https://fortifiedelitecare.com
    VITE_DASHBOARD_ORIGIN=https://dashboard.fortifiedelitecare.com
    VITE_ADMIN_ORIGIN=https://admin.fortifiedelitecare.com

Set the matching backend origins and COOKIE_SAME_SITE=lax at that time. ADMIN_ORIGIN excludes the console path. No DNS or live origin settings are changed by this code update.

## Tests

The session-security suite covers CSRF transport, Request body preservation, failed bootstrap, session-specific 401 handling, warning/continuation, absolute expiry, in-memory isolation, pre-expiry draft-only saves, consultation saving without signing, OTP global logout and review deep links through admin login. Existing upload tests include the CSRF handshake.
