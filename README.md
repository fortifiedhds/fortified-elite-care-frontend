# Fortified Elite Care web

React, TypeScript and Vite. The public site introduces the home care programme and its packages. The patient, doctor and admin portals share a typed NestJS API client.

## Run locally

Start the sibling API and migrate its database first. With Node.js 24:

```sh
npm ci
cp .env.example .env
npm run dev
```

In PowerShell, use `Copy-Item .env.example .env`. Open `http://127.0.0.1:5173`.

To try the workflow:

1. Create a patient and a doctor through their respective forms. Use the same service area for both.
2. Provision an administrator with the command in the backend README. Sign in and approve both applications under **Enrolments**.
3. As the patient, request a checkup for today in the service timezone. As the doctor, claim the visit, document it and sign the note.
4. As an administrator provisioned as a clinical reviewer, release the summary under **Visit management**. As the patient, check **Visit summaries**.

## Build and Cloudflare Pages

Run `npm run lint` and `npm run build`. For a Pages preview, select the frontend repo, use Node 24, set the build command to `npm run build` and the output directory to `dist`. Set `VITE_API_URL` to the HTTPS API URL ending in `/api/v1`. Use a same-site custom domain pair for browser sessions, and set the API's `WEB_ORIGIN` to the exact frontend origin.

## API changes

Generate `openapi.json` from the backend using `npm run openapi`, then run `npm run generate:api` in this checkout. Commit the generated types when changing the API.
