# Doctor application certificates

## Registration experience

The doctor registration label is **MDCN Folio Number**. The API property stays `credentialId` to preserve the existing contract and stored values.

Doctor registration now has two stages. First the doctor supplies their profile and verifies email, or completes the existing Google identity wizard. Then `/portal/credentials` opens **My application**, containing two compulsory fields:

1. University Medical Certificate.
2. MDCN Certificate of Registration.

There is no Google button on the registration page; new Google users continue to enter through Login as before. Password signup routes to certificates after successful OTP verification; Google onboarding routes pending doctors there when the account is established. Returning doctors can resume from My application. An incomplete application also has an overview reminder and a Documents → Medical certificates link.

Verifying email alone does not submit a completed doctor application. The registration copy explains the certificate step before an account is created. Patient registration is unchanged.

## Uploads and downloads

Both files must be selected before Submit both certificates is enabled. Each accepts PDF, JPEG or PNG up to 10 MB. The client rejects empty and oversized files; the server validates format signatures and authorization. A single multipart request posts `medicalDegree` and `mdcnRegistration` to `/doctors/credentials`, using the existing credentialed cookie session. Do not manually set Content-Type; the browser adds the multipart boundary.

While submitting, controls are disabled. Success resets the inputs, refreshes server metadata and shows confirmation. Failure retains file selection so the doctor can retry, and uses the shared safe-error presentation. Unsaved selections do not survive page reload; successfully submitted files are saved server-side.

Uploaded file cards show the original filename, size and a download link. The link opens the authorized backend download endpoint in a new tab with no referrer; the backend redirects to an authenticated Cloudinary link valid for five minutes. The frontend never receives permanent storage URLs in application metadata.

Pending doctors can replace a submitted pair by choosing both files again. The previous version remains available if replacement fails. Approved doctors can download their certificates but see no replacement form and are directed to the care team for corrections.

## Admin review

Admin Enrolments shows whether a doctor has submitted certificates. Review certificates opens `<console>/enrolments/:id/credentials`. The detail screen shows the MDCN Folio Number, both certificates, submission timestamp and revision. It requires an acknowledgement of reviewing both certificates before enabling approval.

Approval sends `credentialsRevision` to the existing enrolment approval route. A stale or missing pair is rejected by the backend even if a caller bypasses the UI. After a failed approval the screen reloads and clears the acknowledgement. Approved doctors remain accessible through the All accounts enrolment filter and View certificates link. Admin Documents has a Doctor certificates section pointing to enrolment reviews.

Only admins with ENROLMENTS_MANAGE can access this workflow. Generic private document uploads remain admin-only. Doctor credentials are a purpose-specific shared review workflow, not a private file library.

## Code and hosting

`src/features/doctor-credentials/DoctorCredentials.tsx` renders the own-application and admin-review variants using the generated DoctorCredentialsView contract. Navigation lives in the existing portal navigation registry. Portal resolves the admin child route under Enrolments and the doctor tab under My application.

The new routes are included in the shared host/surface inventory and Vercel rewrites. Cloudflare's worker uses that inventory, preserving real 404 responses for unknown routes. Both routes support direct navigation and refresh.

Deploy the backend migration and API first. No new frontend environment variables are needed. Existing approved doctors without certificates keep their account status and see an explanation to contact the care team; no fake records are generated.

## Tests

The doctor credential component suite covers multipart payloads, both required fields, file-size checks, upload retries, approved read-only views, mandatory admin acknowledgement, reviewed revision submission, stale-review recovery and both portal routes. Existing password and Google registration tests verify the new label and continuation actions.
