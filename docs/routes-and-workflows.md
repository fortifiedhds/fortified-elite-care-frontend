# Routes and workflows

API paths below omit the common `/api/v1` prefix.

## Public routes

| Route                    | Screen and primary action                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `/` and `/#packages`     | Home and package comparison. Links lead to enrolment, the quote contact and service information.         |
| `/about`                 | Programme purpose and audience.                                                                          |
| `/how-it-works`          | Progression from application to home visits and follow-up.                                               |
| `/services`              | Scope of routine services and package comparison.                                                        |
| `/for-families`          | What older adults, families and sponsors can expect.                                                     |
| `/for-doctors`           | Doctor programme information and application link.                                                       |
| `/faq`                   | Common programme and scheduling questions.                                                               |
| `/contact`               | Care team contact and quote route.                                                                       |
| `/privacy`, `/terms`     | Current explanatory information. See the release checklist for approved legal copy.                      |
| `/login`                 | Sign in with `POST /auth/login`.                                                                         |
| `/account-help`          | Contact the care team or return to sign-in.                                                              |
| `/register?role=patient` | Patient details, then explicit care choices. Sends `POST /auth/register/patient` and opens registration. |
| `/register?role=doctor`  | Doctor profile, coverage and credential ID. Sends `POST /auth/register/doctor` and opens the portal.     |

All portal routes require a valid session. On entry `GET /auth/me` determines the role and review status. `GET /dashboard` supplies the overview, counts and role-specific lists. Sign-out uses `POST /auth/logout`.

## Patient portal

| Route under `/portal`                 | Screen and API use                                                                                                                                       |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                   | Overview, form shortcuts, upcoming care, summaries and updates.                                                                                          |
| `/checkups`                           | Request a standard visit with `POST /visits`. Update preferred date with `PATCH /patients/preference`. Request an extra visit with `POST /extra-visits`. |
| `/appointments`, `/appointments/{id}` | Active appointment list and visit detail from the dashboard.                                                                                             |
| `/history`                            | Completed visits from the dashboard.                                                                                                                     |
| `/summaries`                          | Released patient-facing summaries from the dashboard.                                                                                                    |
| `/registration`                       | Registration catalogue plus `GET/PATCH /patients/forms/{kind}` with `REGISTRATION`.                                                                      |
| `/baseline`                           | Approved patient self-report via the same form routes with `BASELINE_SELF`.                                                                              |
| `/consent`                            | `GET/POST /patients/care-permissions`. Explicit choices, named contacts and last saved date.                                                             |
| `/agreement`                          | Review information for the service agreement. No signing action is available.                                                                            |
| `/payments`                           | Package comparison and quote enquiry.                                                                                                                    |
| `/notifications`                      | In-app updates and `PATCH /notifications/{id}/read`.                                                                                                     |

## Doctor portal

| Route under `/portal`         | Screen and API use                                                                                                                                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                           | Overview and approved-doctor download at `GET /resources/medical-officer-welcome`.                                                                                                                                   |
| `/available`                  | Available visits and `POST /visits/{id}/claim`.                                                                                                                                                                      |
| `/assigned`, `/assigned/{id}` | Assigned and completed visits and appointment detail. Save a consultation with `PATCH /visits/{id}/note` and sign with `POST /visits/{id}/sign`. View or create signed addenda with `GET/POST /visits/{id}/addenda`. |
| `/assigned/{id}/baseline`     | Submitted patient self-report and separate clinician baseline with `GET/PATCH /visits/{id}/baseline`.                                                                                                                |
| `/notifications`              | In-app updates and mark read.                                                                                                                                                                                        |

## Admin portal

| Route under `/portal`     | Screen and API use                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `/`                       | Enrolment, visit and support queue overview.                                                                                     |
| `/enrolments`             | Doctor and patient queues and `PATCH /admin/enrolments/{id}/approve`.                                                            |
| `/enrolments/{id}/review` | Submitted registration and `GET/PATCH /admin/registrations/{id}` for the official review.                                        |
| `/visits`                 | Assign or reassign via `PATCH /admin/visits/{id}/assignment`. Clinical reviewers publish with `POST /admin/visits/{id}/publish`. |
| `/extra-requests`         | Approve an extra visit with a date via `POST /admin/extra-visits/{id}/approve`.                                                  |
| `/billing`                | Quote and payment status information.                                                                                            |
| `/notifications`          | In-app updates and mark read.                                                                                                    |

The form catalogue is loaded via `GET /forms/{kind}/definition`. It defines the labels and answer controls for registration, baseline and structured consultation. See [API integration](api-integration.md) for the form save protocol.
