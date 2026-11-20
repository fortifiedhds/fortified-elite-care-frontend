# Documents, errors and the 404 page

## Administrator Documents

The default Submitted records tab lists recent submitted client registrations, recorded patient care permissions and doctor-signed consultation summaries. My private files retains the previous private upload area.

The admin’s existing grants govern access: ENROLMENTS_MANAGE permits registration and consent review; SUMMARIES_PUBLISH permits signed summary review. No additional document permission is introduced. An administrator with neither grant sees a clear access explanation.

Search matches document title or person name, ignoring case and surrounding whitespace. The type filter combines with the search. Both operate on the recent index returned by GET /admin/documents. The API bounds each source to 50 records; this page is not a complete historical archive.

Review registration opens the existing enrolment review route, where the official-use fields remain editable. View record opens an accessible section below the index for read-only consent or summary details. Opening a record moves focus to its section; closing returns focus to the button that opened it. The request is cancelled on unmount or record change. A failed load offers Try again. Refresh records reloads the index.

Consent detail shows the latest saved revision, including withdrawals and authorised contacts. Initial signup choices also appear when no revised consent exists. These records are labelled recorded acknowledgements, not signed agreements. A signed summary shows doctor, patient, visit date, summary and release status; private clinical observations and original-note addenda are outside this admin view.

Other users’ private files are never included. Patient and doctor Documents now provide role-relevant care records instead of private storage. There is currently no supporting-file submission workflow. See [document workflow audit](document-workflow-audit.md) for the source-material mapping. Agreement signing remains unavailable. Future submissions and executed agreements need explicit workflows before they can appear in this index.

## Admin Billing removed

The admin sidebar has no Billing item. Its former URL, /console-7c6e4b9f2a83/billing, is an unknown route and receives the branded 404 page; it is also absent from Vercel rewrites and the Cloudflare route inventory. BILLING_VIEW is removed from the generated API enum and permission labels. Patient /portal/payments remains available.

Deploy the backend migration before deploying the matching frontend. Existing administrator grants are preserved except the retired billing grant.

## User-facing errors

src/shared/api/client.ts centralises API response and display handling:

- Successful false values and empty arrays remain successful responses.
- 5xx responses always show “We couldn’t complete your request. Please try again shortly.”
- 429 responses ask the user to wait briefly.
- Expected, actionable API messages such as an expired code, incorrect current password or stale form revision remain visible.
- Unexpected errors and JSON parsing failures use the generic request message. Raw exception messages are not shown.
- Connection failures ask the user to check their internet connection and retry. They do not mention servers or the API.
- Technical provider, database, stack trace and UUID parser messages are replaced with the generic message.

Intentional local validation uses UserFacingError, rather than arbitrary Error messages. Do not display error.message directly in product UI. Continue to use messageFor and ErrorMessage.

## 404 experience

The shared NotFound page uses PublicHeader and Footer with the current FEC logo and green/teal/amber palette. It includes a decorative door illustration, a clear 404 label, Back to home, Contact our team, How care works and a portal entry link.

The document title is temporarily set to Page not found | Fortified Elite Care. A skip link targets main-content. Decorative artwork is hidden from screen readers. Layout stacks on small screens without an animation requirement.

Header, footer and recovery links use siteHref so they reach the public website or dashboard when the error page is opened on the admin host. The admin console’s private entry path is not advertised. Unknown routes keep their existing HTTP 404 status in the hosting worker.

## Tests

test/unit/documents-feedback.test.tsx covers records, filtering, consent and summary details, private files, access guidance, retries, retired Billing, safe error mapping and complete 404 navigation. Existing authentication, portal and hosting tests also remain required.
