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
