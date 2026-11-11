# Architecture

The web application is a React SPA compiled by Vite. TypeScript checks both the source and the unit suites. React Router owns browser navigation. The Nest API is responsible for permissions, validation and persistence.

| Folder                     | Ownership                                                                                                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/main.tsx`             | Mounts the app inside the browser router and loads the app stylesheet.                                                                                                        |
| `src/app/`                 | Root routes, session lookup, skip link and the CSS entry point.                                                                                                               |
| `src/features/public/`     | Home, informational pages, contact, public layouts and content.                                                                                                               |
| `src/features/auth/`       | Sign-in, account help, patient and doctor application and authentication layout.                                                                                              |
| `src/features/portal/`     | Role navigation, session exit, dashboard state and operational views. Role-specific screens live under `patient/`, `doctor/` and `admin/`.                                    |
| `src/features/care-forms/` | Patient forms, clinical baseline, consultation fields and addenda, and registration review. Shared field controls, resource hooks and draft wizard are scoped to the feature. |
| `src/features/billing/`    | Package comparison, billing period labels and quote links.                                                                                                                    |
| `src/features/agreements/` | Service agreement review state.                                                                                                                                               |
| `src/shared/api/`          | OpenAPI client, generated schema, response formatting and path parameters.                                                                                                    |
| `src/shared/lib/`          | Calendar presentation and shared care contact details.                                                                                                                        |
| `src/shared/ui/`           | Brand links, text links and shared loading, error and empty-state UI.                                                                                                         |
| `public/`                  | Static brand files, fonts, photography and static-host rules.                                                                                                                 |
| `test/`                    | Browser component fixtures, setup and unit suites.                                                                                                                            |

## Data and view boundaries

The app looks up the current account on entry. The portal loads a role-specific dashboard and supplies it to its view. After a successful workflow action, the portal refreshes the dashboard. Forms fetch their own resources and keep their transient input and errors local. See [API integration](api-integration.md).

Keep a new screen with its owning feature. Extract a component within that feature when multiple views share it. Put cross-feature primitives under `shared/`, which should have no dependency on feature folders. Application composition belongs under `app/`. When adding a portal screen, update both the role navigation and the route rendering, and include deep-link and wrong-role checks.

Client routing limits what is shown in each workspace. The server makes the authorization decision on each request. Use the API's role-filtered data and avoid storing clinical data in local storage or reproducing server authorization rules as a source of truth.
