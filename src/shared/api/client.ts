import createClient from "openapi-fetch";
import type { components, paths } from "./schema";
import { createSecureFetch } from "./security-fetch";

export const apiBase = (
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000/api/v1"
).replace(/\/$/, "");

export const api = createClient<paths>({
  baseUrl: apiBase,
  credentials: "include",
  fetch: createSecureFetch(apiBase),
});
export const secureFetch = createSecureFetch(apiBase);

export type Account = components["schemas"]["AccountView"];
export type Dashboard = components["schemas"]["DashboardView"];
export type Visit = components["schemas"]["VisitView"];
export type PatientInput = components["schemas"]["PatientInput"];
export type NoteInput = components["schemas"]["NoteInput"];

const requestFailed =
  "We couldn’t complete your request. Please try again shortly.";
export class UserFacingError extends Error {}

function safeMessage(message: string) {
  return (
    message.length < 500 &&
    !/prisma|postgres|sqlstate|stack trace|node_modules|ECONN|ENOTFOUND|\bAPI\b|\bSMTP\b|database|internal server|unexpected token|failed to fetch|validation failed \(uuid/i.test(
      message,
    )
  );
}

export function readResponse<T>(result: {
  data?: T;
  error?: unknown;
  response: Response;
}): T {
  if (result.response.ok && result.data !== undefined) return result.data;
  const message =
    result.error &&
    typeof result.error === "object" &&
    "message" in result.error
      ? result.error.message
      : null;
  if (result.response.status >= 500) throw new UserFacingError(requestFailed);
  if (result.response.status === 429)
    throw new UserFacingError(
      "You’ve made several requests in a short time. Please wait a moment and try again.",
    );
  if (typeof message === "string" && safeMessage(message))
    throw new UserFacingError(message);
  if (
    Array.isArray(message) &&
    message.length > 0 &&
    message.every((item) => typeof item === "string" && safeMessage(item))
  ) {
    throw new UserFacingError(message.join(". "));
  }
  throw new UserFacingError(requestFailed);
}

export function messageFor(error: unknown) {
  return error instanceof TypeError
    ? "We couldn’t connect right now. Check your internet connection and try again."
    : error instanceof UserFacingError
      ? error.message
      : requestFailed;
}

export const pathParams = (id: string) => ({ params: { path: { id } } });
