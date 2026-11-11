# Operations

## Local development

Start the sibling API and migrate its database using the [backend runbook](../../fortified-elite-care-backend/docs/operations.md). With Node.js 24:

```sh
npm ci
cp .env.example .env
npm run dev
```

Use `Copy-Item .env.example .env` in PowerShell. Open `http://127.0.0.1:5173`. The dev server uses a strict port so the API origin can be set explicitly. `VITE_API_URL` is read by Vite at build time. Restart Vite after changing it. Never place server secrets in a Vite environment variable.

## Full workflow smoke check

1. Create a patient and a doctor using the same service area. As the patient, save and resume a registration draft, then submit.
2. Provision a clinical reviewer using the backend runbook. In **Enrolments**, review the patient registration, assign a client number, then approve the patient and doctor.
3. As the patient, confirm that home visits are allowed in **Care permissions**. Submit a baseline self-report and request a checkup for today in the service timezone.
4. As the doctor, claim the visit, open the clinical baseline and verify the submitted self-report is visible there. Save a consultation draft, then sign it. Add a signed correction if exercising the addendum flow.
5. As the clinical reviewer, release the signed summary under **Visit management**. As the patient, open **Visit summaries** and verify it displays the released summary.
6. Try the quote enquiry on **Payments** and review the service agreement page. See [FEC's outstanding decisions](../../fortified-elite-care-backend/docs/checkout-and-agreement.md) for the activation dependencies.

Use synthetic accounts and separate browser sessions for the three roles.

## Builds and preview

```sh
npm run lint
npm test
npm run build
npm run preview
```

For Cloudflare Pages use Node.js 24, `npm run build`, the `dist` output directory, and the HTTPS API base URL ending in `/api/v1`. Serve the SPA entry for client routes so a direct visit to a portal URL works. Use same-site HTTPS custom domains for the app and API and set the backend `WEB_ORIGIN` to the exact web origin.

If authentication fails, inspect the browser network response for `/auth/me`. Check the cookie and configured origin, then ensure the backend health endpoint responds. If a route loads on navigation but fails on refresh, check SPA routing at the host.
