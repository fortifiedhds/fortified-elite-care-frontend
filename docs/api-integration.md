# API integration

## Contract and client

`src/shared/api/client.ts` creates an OpenAPI Fetch client with browser credentials included. It takes its base URL from `VITE_API_URL`, defaults to `http://127.0.0.1:3000/api/v1`, and removes a trailing slash. Keep `/api/v1` in the base and use API-relative operation paths.

In the sibling API repository run `npm run build` and `npm run openapi`. Then run `npm run generate:api` here. Commit the generated `src/shared/api/schema.ts` with the corresponding server contract update. The generated file is excluded from formatting and coverage.

```ts
const response = await api.POST("/visits", { body: { date } });
const visit = readResponse(response);
```

`readResponse` returns successful response data, including false or empty arrays, and converts API validation messages to an error. `messageFor` converts transport failures into a user-facing message. The portal shows request progress and reloads its dashboard after successful changes. For view loads, pass the supplied abort signal through to the client.

## Sessions and permissions

Authentication writes return AuthResult with either account, challenge or onboarding. A challenge opens the browser-bound email verification route. The shared VerificationForm also handles password and administrator confirmations. Google onboarding reads its verified identity from the API before collecting the role profile. See [authentication and administrators](authentication-and-admin.md) for request details and route behavior.

The browser keeps the HTTP-only session cookie. The frontend stores the public account view in React state. A failed session check redirects private routes to login. Portal navigation and screens use the account's role and review state. The API enforces access independently on each read and write. Keep local development on `127.0.0.1` for both sites and set `WEB_ORIGIN` on the backend to the exact frontend origin.

## Form protocol

1. Fetch the form definition and record for the chosen patient form or visit. Use the template's version and field IDs. Use revision 0 for a new record.
2. Keep local answers during step navigation. **Save and exit** writes the current answers with `submit: false`. **Submit** writes with `submit: true`.
3. Send the definition version and record revision with every write. Update local state from the response. A submitted record is displayed read-only.
4. If a save fails, keep visible input and show the API message. A conflict may require reloading the latest state before reapplying edits.
5. Care choices have their own version and payload. Consultation draft, note signature, addendum and publication are separate API operations.

Do not include clinical data in analytics, logs, mailto parameters or stored browser preferences. The billing mailto includes general quote information only. The welcome pack is downloaded through an authenticated API URL.
