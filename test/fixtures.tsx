import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { vi } from "vitest";
import type { Account, Dashboard, Visit } from "../src/shared/api/client";
import { api } from "../src/shared/api/client";

export const patient: Account = {
  id: "patient",
  name: "Test Patient",
  email: "patient@example.test",
  role: "PATIENT",
  reviewStatus: "APPROVED",
  clinicalReviewer: false,
  adminPermissions: [],
};
export const doctor: Account = {
  ...patient,
  id: "doctor",
  name: "Test Doctor",
  role: "DOCTOR",
};
export const admin: Account = {
  ...patient,
  id: "admin",
  name: "Test Admin",
  role: "ADMIN",
  adminPermissions: [
    "ENROLMENTS_MANAGE",
    "VISITS_MANAGE",
    "EXTRA_VISITS_MANAGE",
    "ADMINS_MANAGE",
  ],
};
export const pending = (account: Account): Account => ({
  ...account,
  reviewStatus: "PENDING",
});
export const today = "2099-06-15";
export const signupChallenge = {
  email: patient.email,
  purpose: "SIGNUP" as const,
  expiresAt: "2099-06-15T12:00:00Z",
  resendAt: "2000-01-01T00:00:00Z",
};
export const visit: Visit = {
  id: "visit-1",
  area: "Central",
  date: today,
  status: "ASSIGNED",
  extra: false,
  doctorName: doctor.name,
  doctorId: doctor.id,
};
export const dashboard = (
  account = patient,
  overrides: Partial<Dashboard> = {},
): Dashboard => ({
  account,
  serviceToday: today,
  preferredDayOfMonth: account.role === "PATIENT" ? 15 : undefined,
  visits: [],
  available: [],
  support: [],
  notifications: [],
  enrolments: [],
  ...overrides,
});
export function Location() {
  return (
    <span role="note" aria-label="Current route">
      {useLocation().pathname}
    </span>
  );
}
export function view(node: ReactNode, url = "/") {
  return render(
    <MemoryRouter initialEntries={[url]}>
      {node}
      <Location />
    </MemoryRouter>,
  );
}
type Reply = { data?: unknown; error?: unknown; response: Response };
export const ok = (data: unknown, status = 200): Reply => ({
  data,
  response: new Response(null, { status }),
});
export const fail = (status: number, message: string | string[]): Reply => ({
  error: { message },
  response: new Response(null, { status }),
});

export function reply(
  method: "GET" | "POST" | "PATCH",
  responses: Record<string, Reply | (() => Reply | Promise<Reply>)>,
) {
  return vi.mocked(api[method]).mockImplementation(async (path) => {
    const result = responses[path];
    if (!result)
      throw new Error("Unexpected test request: " + method + " " + path);
    // Each test supplies the response for its specific OpenAPI path.
    return (typeof result === "function" ? await result() : result) as never;
  });
}
export const runAction = async (fn: () => Promise<unknown>) => {
  await fn();
  return true;
};
