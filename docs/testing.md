# Testing

`test/unit/password-input-verification.test.tsx` covers default masking, keyboard/mouse toggles, unchanged password values, no accidental form submission, disabled controls, all password-bearing screens, challenge retries and registration recovery. OTP verification remains bound to the server challenge.

The unit suite uses Vitest, jsdom and React Testing Library. It mounts route or feature components using React Router's memory router and mocks the API client. It does not need a live browser, API or database.

| Command                                           | Use                                                         |
| ------------------------------------------------- | ----------------------------------------------------------- |
| `npm test`                                        | Run all unit and component tests once.                      |
| `npm run test:watch`                              | Rerun tests as files change.                                |
| `npm run test:coverage`                           | Print V8 coverage and create an HTML report in `coverage/`. |
| `npx vitest run test/unit/forms-billing.test.tsx` | Run one suite.                                              |
| `npm run build`                                   | Typecheck source and tests, then build the SPA.             |

## Suites

- [Identity and settings](../test/unit/identity-settings.test.tsx) covers Google availability and onboarding, passwordless guidance, OTP errors, cooldown and expiry, create/change password, console login, permission-filtered navigation, administrator creation and document uploads.

- [App, auth and public](../test/unit/app-auth-public.test.tsx) covers session gating, public route rendering, navigation, patient and doctor applications, sign-in and failures, and shared response and date behavior.
- [Forms and billing](../test/unit/forms-billing.test.tsx) covers draft/resume, field interactions, retries, stale saves, read-only submissions, patient and clinician baselines, care choices and sharing, consultation addenda, admin registration review, quotes, and the service agreement state.
- [Portal](../test/unit/portal.test.tsx) covers role views, dashboard refresh and errors, sign-out, visit requests and preferences, appointments, extra visits, claims, note drafting and signing, admin assignment and release, enrolment and notification read actions.

Use `test/fixtures.tsx` for synthetic role accounts and typed dashboard fixtures. Configure an explicit mock response for every API request the scenario is intended to make. Test by accessible role and label where possible. Assert both user feedback and the request shape for a workflow write. Use asynchronous queries for updates driven by a request or route transition.

The backend integration suite verifies HTTP behavior and PostgreSQL transactions. Use the [smoke check](operations.md#full-workflow-smoke-check) when changing styling, route transitions or full workflows that need real browser sessions.
