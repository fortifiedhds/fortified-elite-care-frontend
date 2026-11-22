# Fortified Elite Care web documentation

See [first-party authentication](first-party-auth.md) for the Vercel API proxy, iPhone cookie fix, Google callback relay and release checks.

See [password recovery](password-recovery.md) for forgot-password screens, OTP verification, Google-only accounts, expiry and deployment.

See [session security](session-security.md) for CSRF transport, inactivity warnings, draft recovery, OTP global logout and MVP hosting settings.

See [doctor certificates](doctor-certificates.md) for the two-stage registration flow, required uploads, private downloads and admin review.

See [monthly scheduling](monthly-scheduling.md) for the recurring-day control and [document workflow audit](document-workflow-audit.md) for how the original CEO materials are used.

See [mobile navigation](mobile-navigation.md) for the public and portal menus, shared lifecycle and responsive behaviour.

See [contact page](contact-page.md) for the public enquiry and feedback form, state handling and inbox configuration.

See [documents and feedback](documents-and-feedback.md) for submitted admin records, safe errors, removal of admin Billing and the branded 404 experience.

| Reference                                                        | Contents                                                                           |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [Architecture](architecture.md)                                  | Application entry points, feature boundaries and reusable modules                  |
| [Routes and workflows](routes-and-workflows.md)                  | Public screens, patient, doctor and admin routes, and corresponding API calls      |
| [API integration](api-integration.md)                            | Generated types, browser sessions, request patterns, revisions and error recovery  |
| [Authentication and administrators](authentication-and-admin.md) | Google onboarding, OTP, password settings, admin permissions and private documents |
| [Design system](design-system.md)                                | Brand, fonts, CSS, layout and motion                                               |
| [Operations](operations.md)                                      | Local setup, full workflow smoke check and deployment                              |
| [Testing](testing.md)                                            | Unit and component suites, fixtures, coverage and CI                               |

The sibling API repository contains the server contract and the [checkout and agreement decisions](../../fortified-elite-care-backend/docs/checkout-and-agreement.md). See [domains and deployment](domains-and-deployment.md) for the public, dashboard and admin hosts, Cloudflare worker and HTTP 404 behavior.
