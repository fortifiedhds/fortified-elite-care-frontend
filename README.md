# Fortified Elite Care web

React, TypeScript and Vite for the public site and the patient, doctor and admin portals.

## Run locally

Start the sibling API and migrate its database first. With Node.js 24:

```sh
npm ci
cp .env.example .env
npm run dev
```

Use `Copy-Item .env.example .env` in PowerShell. Open `http://127.0.0.1:5173`.

## Development

- `npm run lint` checks formatting.
- `npm test` runs the unit and browser component tests.
- `npm run test:coverage` writes a coverage report.
- `npm run build` typechecks and builds the SPA.
- `npm run generate:api` rebuilds the client schema from the sibling backend's `openapi.json`.

See the [documentation index](docs/README.md) for structure, routes, API usage, styling and the local workflow.

The administrator console opens at `/console-7c6e4b9f2a83`. Follow [authentication and administrators](docs/authentication-and-admin.md) for Google onboarding, mailbox verification, password settings and private documents. Initial administrator credentials, SMTP, Google OAuth and Cloudinary are configured in the sibling backend.

## Deployment

For Vercel, use `npm run build` as the build command and `dist` as the output directory. Set `VITE_API_URL` to the hosted API base URL, including `/api/v1`, before building. Redeploy after changing build-time environment variables. The committed `vercel.json` handles direct navigation to application routes; see [domains and deployment](docs/domains-and-deployment.md) for the hosting configuration.
