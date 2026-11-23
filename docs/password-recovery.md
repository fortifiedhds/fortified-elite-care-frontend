# Forgot password and account recovery

## Screens and navigation

The shared authentication layout uses an intrinsic logo row and a flexible content row on mobile (`grid-template-rows: auto 1fr`). This keeps the teal brand header compact even on tall viewports or short success screens. The desktop photograph panel retains its full-height layout. Browser verification compares header height across login, reset and confirmation at multiple mobile widths.

`Login` offers **Forgot password?** beside the email/password form. Patients and doctors go to `/forgot-password`; admin login goes to `/console-7c6e4b9f2a83/forgot-password`. Account help also links to password recovery. Google remains an option only on login, as before.

`ForgotPassword` collects an email and submits `{ email, admin }`. Every entry starts at **Send OTP**, including returning from Sign in or refreshing the page. It does not restore an earlier server challenge. The screen uses one instruction explaining “one-time passcode (OTP)” and has no eligibility or Google helper paragraphs. Only an accepted request opens verification. An unrecognised/ineligible address stays on the email form with **We couldn’t find an account with that email address. Check it and try again.** The user can correct the address and submit again.

The verification screen contains the OTP input, verify/resend controls and **Back to sign in**. The extra “Use the latest code…” paragraph and **Start a new request** button have been removed. Resend retains the existing cooldown. If the user entered the wrong email, they return to Sign in and reopen Forgot password to enter another address. An expired code gives the same navigation guidance. Eligible Google-only users can still create a first password through this flow and retain Google sign-in. No new account is created through recovery.

`ResetPassword` first checks the browser's restricted recovery grant. It offers new password and confirmation fields, both with accessible show/hide controls, 12-character minimum and 128-character maximum. It catches mismatches before sending the request. Successful completion clears the app's account, session deadline state and in-memory drafts, then shows a confirmation and a sign-in link. It does not navigate straight into a dashboard. Admin sign-in still requires its separate email OTP.

## API and browser state

The generated OpenAPI client calls:

| Operation                   | API endpoint                            |
| --------------------------- | --------------------------------------- |
| Start a request             | `POST /auth/password-recovery/request`  |
| Verify OTP                  | `POST /auth/password-recovery/verify`   |
| Resend OTP                  | `POST /auth/resend`                     |
| Check limited reset session | `GET /auth/password-recovery/grant`     |
| Set the password            | `POST /auth/password-recovery/complete` |

The shared secure fetch transport supplies credentials and obtains a CSRF proof for each mutation. The API owns all eligibility checks, throttles, hashing, OTP validation, grants and revocations. JavaScript never reads the HttpOnly challenge/reset cookies. Codes and grants are never put in URL query parameters, local storage or session storage. Password fields are cleared after success; typed passwords are not persisted as drafts.

Code entry is held only in the current mounted screen. Leaving or refreshing it returns to the email form; the browser's old challenge cookie cannot reopen verification automatically. A successful new request replaces that cookie. The backend challenge-status endpoint remains available to API clients, but the frontend does not call it on entry. The reset form can resume via a valid five-minute grant cookie, but previously typed passwords must be re-entered. Recovery requests last ten minutes with five verification attempts, and resend has a one-minute cooldown. The reset screen checks its grant on load and updates its local expiry display every second. Server validation remains authoritative if another device resets the password, account status changes, or a request expires while saving.

## Errors and accessible behaviour

- Email and code submission controls are disabled while the corresponding request is in flight. The email form opens immediately without fetching an old challenge.
- Reset-grant lookups are aborted on unmount. Care/admin requests keep their separate account scopes.
- Invalid codes remain in the verification screen for correction. Resend rotates the code and clears the typed value. To use another email, follow **Back to sign in** and reopen Forgot password.
- An expired or missing grant hides the password form and offers **Request a new code**. A save failure shows the user-facing API error and does not clear signed-in state as though a reset succeeded.
- Email uses username autocomplete; OTP uses one-time-code autocomplete, a numeric keyboard and six-digit validation. New password fields use `new-password` autocomplete and descriptive show/hide labels. Status and error text use existing accessible feedback components.
- A request for an unknown, disabled, unverified or wrong-scope account returns HTTP 400 and creates no OTP challenge. The UI keeps the entered email for correction. Account approval, reactivation and enrolment remain separate workflows.

## Hosting and deployment

The recovery routes are included in `shared/lib/routes.ts`, Vercel rewrites and Cloudflare's route inventory. Refreshing these routes serves the SPA. Patient/doctor recovery belongs to the dashboard host; administrator recovery stays under the console prefix on the admin host. `admin.fortifiedelitecare.com/` and unknown pages continue to return 404.

Deploy the backend before this frontend. Existing API origin and cookie configuration apply; no new migration, frontend environment variable or email credential is needed for this UX change. The current Vercel deployment uses the [first-party API proxy](first-party-auth.md), so the flow does not depend on third-party cookies.

## Tests and manual checks

`test/unit/password-recovery.test.tsx` covers care/admin links, accepted and rejected email submission, fresh entry after Sign in or refresh, removed helper controls, scope isolation, OTP errors and resend, expiry guidance, navigation to reset, password confirmation and visibility, success/logout, expired/missing grants, save errors, and route registration. The existing shared OTP, password input, CSRF and hosting tests also run.

Run `npm test -- --pool=forks --maxWorkers=1`, `npm run build` and `npm run lint`. On mobile and desktop, check email → OTP → new password → success → normal sign-in, using a test mailbox. Confirm old sessions are rejected, Google-only users can then use either authentication method, and administrator password recovery does not bypass sign-in verification. Browser QA should mock mail/API responses or use a controlled test account; unit tests never send mail.
