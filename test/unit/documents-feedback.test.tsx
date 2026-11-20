import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminDocuments } from "../../src/features/files/AdminDocuments";
import { Portal } from "../../src/features/portal/Portal";
import { NotFound } from "../../src/features/public/NotFound";
import {
  messageFor,
  readResponse,
  UserFacingError,
} from "../../src/shared/api/client";
import {
  adminConsolePath,
  defaultOrigins,
  isAppRoute,
} from "../../src/shared/lib/routes";
import * as sites from "../../src/shared/lib/sites";
import { admin, dashboard, fail, ok, reply, view } from "../fixtures";

const date = "2026-11-20T10:00:00Z";
const registration = {
  id: "registration",
  kind: "REGISTRATION",
  title: "Client registration",
  personName: "Ada Adebayo",
  personRole: "PATIENT",
  patientId: "patient",
  recordedAt: date,
  version: "v2",
  status: "Submitted",
};
const choices = {
  ...registration,
  id: "patient",
  kind: "CARE_PERMISSIONS",
  title: "Care permissions",
  status: "Recorded",
};
const signed = {
  ...registration,
  id: "visit",
  kind: "CONSULTATION",
  title: "Signed consultation summary",
  personName: "Dr Ada",
  personRole: "DOCTOR",
  status: "Signed · awaiting review",
};
const reviewer = {
  ...admin,
  adminPermissions: [
    ...(admin.adminPermissions ?? []),
    "SUMMARIES_PUBLISH" as const,
  ],
};

describe("administrator submitted documents", () => {
  it("opens on submitted records, filters by name/type and links to the registration review", async () => {
    reply("GET", { "/admin/documents": ok([registration, choices, signed]) });
    view(
      <AdminDocuments account={reviewer} />,
      adminConsolePath + "/documents",
    );
    const link = await screen.findByRole("link", {
      name: "Review registration for Ada Adebayo",
    });
    expect(link.getAttribute("href")).toBe(
      adminConsolePath + "/enrolments/patient/review",
    );
    expect(
      screen.queryByRole("heading", { name: "Your private documents" }),
    ).toBeNull();
    fireEvent.change(screen.getByLabelText("Search records"), {
      target: { value: "Dr Ada" },
    });
    expect(
      screen.queryByRole("link", { name: /Review registration/ }),
    ).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Signed consultation summary" }),
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Document type"), {
      target: { value: "CARE_PERMISSIONS" },
    });
    expect(screen.getByText("No matching records")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Search records"), {
      target: { value: "" },
    });
    expect(
      screen.getByRole("heading", { name: "Care permissions" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Signed consultation summary" }),
    ).toBeNull();
  });
  it("shows recorded withdrawals and authorised contacts without describing consent as a signature", async () => {
    reply("GET", {
      "/admin/documents": ok([choices]),
      "/admin/documents/{kind}/{id}": ok({
        ...choices,
        consent: {
          version: "v2",
          recordedAt: date,
          choices: { homeVisits: false, sharing: true },
          recipients: [
            { name: "Bola", relationship: "Daughter", phone: "+2340000000" },
          ],
        },
      }),
    });
    view(<AdminDocuments account={admin} />);
    fireEvent.click(
      await screen.findByRole("button", {
        name: "View care permissions for Ada Adebayo",
      }),
    );
    expect(await screen.findByText("Not agreed / withdrawn")).toBeTruthy();
    expect(screen.getByText(/Bola · Daughter/)).toBeTruthy();
    expect(screen.getByText(/not signed agreements/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close record" }));
    expect(
      screen.queryByRole("region", { name: "Document details" }),
    ).toBeNull();
  });
  it("opens a signed doctor summary and keeps private uploads in their own tab", async () => {
    reply("GET", {
      "/admin/documents": ok([signed]),
      "/admin/documents/{kind}/{id}": ok({
        ...signed,
        summary: "Signed summary for review",
        patientName: "Ada",
        visitDate: "2026-11-20",
      }),
      "/files": ok([]),
    });
    view(<AdminDocuments account={reviewer} />);
    fireEvent.click(
      await screen.findByRole("button", {
        name: "View signed consultation summary for Dr Ada",
      }),
    );
    expect(await screen.findByText("Signed summary for review")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "My private files" }));
    expect(
      await screen.findByRole("heading", { name: "Your private documents" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Submitted records" }),
    ).toBeNull();
  });
  it("explains restricted access and recovers after a temporary service problem", async () => {
    const get = reply("GET", {
      "/admin/documents": fail(503, "SQL connection exception"),
    });
    view(<AdminDocuments account={reviewer} />);
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "We couldn’t complete your request. Please try again shortly.",
    );
    get.mockResolvedValue(ok([]));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("No submitted records yet")).toBeTruthy();
  });
  it("removes admin Billing and keeps patient Payments routes", async () => {
    reply("GET", { "/dashboard": ok(dashboard(admin)) });
    view(
      <Portal
        account={admin}
        basePath={adminConsolePath}
        onSignOut={vi.fn()}
      />,
      adminConsolePath,
    );
    await screen.findByRole("heading", { name: "Welcome, Test Admin" });
    fireEvent.click(
      screen.getByRole("button", { name: "Open portal navigation" }),
    );
    expect(screen.queryByRole("link", { name: "Billing" })).toBeNull();
    expect(isAppRoute(adminConsolePath + "/billing", "admin")).toBe(false);
    expect(isAppRoute("/portal/payments", "dashboard")).toBe(true);
  });
  it("explains when an administrator has no document review permission", async () => {
    reply("GET", { "/admin/documents": ok([]) });
    view(<AdminDocuments account={{ ...admin, adminPermissions: [] }} />);
    expect(
      await screen.findByText(
        /Your account does not have access to submitted records/,
      ),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Search records")).toBeNull();
  });
});
describe("safe feedback and not-found navigation", () => {
  it("preserves actionable errors but hides backend failures, parse errors and raw internal messages", () => {
    expect(messageFor(new TypeError("fetch failed: ECONNREFUSED"))).toBe(
      "We couldn’t connect right now. Check your internet connection and try again.",
    );
    expect(messageFor(new SyntaxError("Unexpected token <"))).not.toContain(
      "Unexpected",
    );
    expect(
      messageFor(new Error("password database stack trace")),
    ).not.toContain("database");
    expect(messageFor(new UserFacingError("Choose yes or no."))).toBe(
      "Choose yes or no.",
    );
    expect(() =>
      readResponse(fail(503, "Prisma: secret connection details")),
    ).toThrow("We couldn’t complete your request.");
    expect(() =>
      readResponse(fail(400, "ECONNREFUSED on internal server")),
    ).toThrow("We couldn’t complete your request.");
    expect(() =>
      readResponse(
        fail(401, "Your code has expired. Start the request again."),
      ),
    ).toThrow("Your code has expired.");
    expect(() => readResponse(fail(429, "ThrottlerException"))).toThrow(
      "Please wait a moment",
    );
  });
  it("adds a public header, footer, useful recovery links and a descriptive title to the 404", () => {
    const before = document.title;
    const page = view(<NotFound />);
    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("contentinfo")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /Let’s get you.*back to care/ }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Back to home" }).getAttribute("href"),
    ).toBe("/");
    expect(
      screen
        .getByRole("link", { name: "Contact our team" })
        .getAttribute("href"),
    ).toBe("/contact");
    expect(document.title).toBe("Page not found | Fortified Elite Care");
    page.unmount();
    expect(document.title).toBe(before);
  });
  it("sends header, footer and recovery links to the public domain when opened on another host", () => {
    vi.spyOn(sites, "siteHref").mockImplementation(
      (site, path) => defaultOrigins[site] + path,
    );
    view(<NotFound />);
    const header = within(screen.getByRole("banner")),
      footer = within(screen.getByRole("contentinfo"));
    expect(
      header.getByRole("link", { name: "How it works" }).getAttribute("href"),
    ).toBe(defaultOrigins.public + "/how-it-works");
    expect(
      header.getByRole("link", { name: "Sign in" }).getAttribute("href"),
    ).toBe(defaultOrigins.dashboard + "/login");
    expect(
      footer.getByRole("link", { name: "Contact" }).getAttribute("href"),
    ).toBe(defaultOrigins.public + "/contact");
    expect(screen.queryByRole("link", { name: /admin console/i })).toBeNull();
  });
});
