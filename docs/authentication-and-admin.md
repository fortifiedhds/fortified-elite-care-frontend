# Authentication, administrator console and documents

## Password visibility

All password fields use `src/shared/ui/PasswordInput.tsx`: public/admin sign-in, patient/doctor registration, current/new/confirmation passwords in Settings, and initial administrator passwords. Fields start masked. Each eye button toggles its own field, preserves the value and autocomplete behavior, has a keyboard-accessible Show/Hide label and pressed state, and uses `type="button"` to avoid submitting the form. Visibility is local component state and is not persisted.

## Verification recovery

For forgotten passwords, use the separate [password recovery flow](password-recovery.md). It supports both existing-password and Google-only accounts, verifies an email OTP, then offers a new-password screen. Administrators use the console-specific recovery routes.

The verification page fetches the browser-bound challenge before displaying the code input. Email delivery alone does not replace that binding. A failed lookup offers **Try again**; signup also offers **Restart registration** for the originally selected patient or doctor role. Router state carries only the selected role. Administrator recovery continues to use the console sign-in route.

For direct Vercel-to-Render requests, set `NODE_ENV=production` and `COOKIE_SAME_SITE=none` on the backend, redeploy and start a fresh signup/sign-in request. The API client already includes credentials. CORS approval does not override SameSite restrictions, and browsers that block third-party cookies can still reject `SameSite=None`. The shared-domain MVP avoids that cross-site dependency.

## Frontend routes

| Route                                | Entry and behavior                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| /login                               | Password sign-in and Google sign-in. Google is enabled after the API reports its provider configuration |
| /register                            | Patient or doctor password signup with role-specific details and patient care choices                   |
| /verify-email                        | Browser-bound email OTP after signup, initial mailbox verification or Google linking                    |
| /console-7c6e4b9f2a83/verify-email   | Administrator mailbox verification within the console                                                   |
| /google/onboarding                   | Verified Google profile, followed by patient or doctor role selection and details                       |
| /portal/settings                     | Create password for a Google-only account, or change an existing password                               |
| /portal/documents                    | Owner-scoped private uploads and downloads                                                              |
| /console-7c6e4b9f2a83                | Separate administrator login and dashboard                                                              |
| /console-7c6e4b9f2a83/administrators | Create separate administrators and edit permissions                                                     |
| /console-7c6e4b9f2a83/settings       | Administrator password change with OTP                                                                  |

The shared console path constant is in src/shared/lib/admin.ts. The backend's matching path is used in notification email links. A deployed Vercel frontend uses the existing SPA rewrite so refresh and direct navigation work.

## State and requests

Login and Register consume AuthResult. A challenge result opens VerifyEmail. An account result updates App state. The browser keeps the HTTP-only challenge and session cookies. JavaScript does not receive the OTP hash, session token or Google provider token.

VerificationForm is reused for signup, password settings and administrator actions. It shows the recipient address, supports a six-digit code and a resend cooldown, reports errors and disables expired requests. Password and administrator changes can be cancelled and restarted.

Google is offered on Login. The button navigates to the backend redirect endpoint. After provider verification, GoogleOnboarding fetches the verified profile and reuses Register's role-specific wizard. The email is read-only and password controls are omitted. The server reads the email and Google subject from the short-lived onboarding cookie record. Later Google sign-ins return directly to the dashboard.

Settings fetches password availability from /auth/security. Creating a password asks for a new password and confirmation. Changing one also asks for the current password. Both request a mailbox code and confirm through /auth/password/confirm.

## Administrator permissions

Administrator accounts sign in through the separate console. Its login submits to /auth/admin/login and always proceeds through an email code. Patient and doctor accounts retain the public portal.

The administrator navigation filters queues by the permissions returned by the API. Visit management can also be opened by a summary reviewer, with assignment controls available only to visit managers. The backend filters dashboard data and authorizes mutations independently.

The Administrators screen collects name, a separate email, an initial password and selected permissions. Creation and permission edits are confirmed using the acting administrator's email OTP. The API rejects stale edits and removal of the last administrator manager. Passwords are cleared from the rendered form when the verification step opens.

The first administrator and provider credentials are configured in the backend environment. Follow the [backend authentication setup](../../fortified-elite-care-backend/docs/authentication.md).

## Documents

Administrator Documents now opens submitted records with a separate My private files tab. See [documents and feedback](documents-and-feedback.md) for permissions, signed summaries, consent choices and agreement limitations.

The administrator private-file area posts one file to /files using FormData and browser credentials. Accepted file types are PDF, PNG and JPEG up to 10 MB. The UI reports upload status, reloads the metadata list and clears the file picker after success.

Download links go through /files/{id}/download. The API checks ownership before issuing a temporary signed Cloudinary URL. See the [storage reference](../../fortified-elite-care-backend/docs/email-and-storage.md).

## Test coverage

The identity-settings component suite covers provider availability, Google-only onboarding, OTP expiry and resend, password creation and change, administrator routes and permission filtering, separate admin creation and private file lists. The app signup test completes mailbox verification before asserting the registration-draft route. Backend integration tests verify the same flows with real PostgreSQL and controlled provider fakes.
