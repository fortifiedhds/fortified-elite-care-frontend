import createClient from "openapi-fetch";
import type { components, paths } from "./schema";

export const apiBase = (
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000/api/v1"
).replace(/\/$/, "");

export const api = createClient<paths>({
  baseUrl: apiBase,
  credentials: "include",
});

export type Account = components["schemas"]["AccountView"];
export type Dashboard = components["schemas"]["DashboardView"];
export type Visit = components["schemas"]["VisitView"];
export type PatientInput = components["schemas"]["PatientInput"];
export type NoteInput = components["schemas"]["NoteInput"];

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
  if (typeof message === "string") throw new Error(message);
  if (
    Array.isArray(message) &&
    message.every((item) => typeof item === "string")
  ) {
    throw new Error(message.join(". "));
  }
  throw new Error(
    "The service could not complete this request. Please try again.",
  );
}

export function messageFor(error: unknown) {
  return error instanceof TypeError
    ? "The care service is unavailable. Check that the API is running and try again."
    : error instanceof Error
      ? error.message
      : "Something went wrong. Please try again.";
}
