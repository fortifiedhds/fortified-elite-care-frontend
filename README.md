# Fortified Elite Care web

React, TypeScript and Vite. The public site introduces the home care programme and its packages. The patient, doctor and admin portals share a typed NestJS API client.

## Run locally

Start the sibling API with its demo database and seed accounts first. With Node.js 24:

```sh
npm ci
cp .env.example .env
npm run dev
```

In PowerShell, use `Copy-Item .env.example .env`. Open `http://127.0.0.1:5173`. Use the seeded account buttons on the sign-in screen.

To try the workflow:

1. Sign in as the patient and request a checkup dated today in the service timezone.
2. Sign in as the admin and approve the seeded doctor under **Enrolments**.
3. Sign in as the doctor. Claim the visit under **Available requests**, then document and sign it under **Assigned visits**. Use fictional observations.
4. Sign in as the admin and release the summary under **Visit management**.
5. Sign in as the patient and open **Visit summaries**.

## Build and Cloudflare Pages

Run `npm run lint` and `npm run build`. For a Pages preview, select the frontend repo, use Node 24, set the build command to `npm run build` and the output directory to `dist`. Set `VITE_API_URL` to the HTTPS API URL ending in `/api/v1`. Use a same-site custom domain pair for browser sessions, and set the API's `WEB_ORIGIN` to the exact frontend origin.

This build is for synthetic evaluation. The public package comparison links to FHDS for enquiries. The portal has no checkout, sponsor sign-in or real patient onboarding. The homepage photo comes from the supplied Fortified HDS service page.

## API changes

Generate `openapi.json` from the backend using `npm run openapi`, then run `npm run generate:api` in this checkout. Commit the generated types when changing the API.
