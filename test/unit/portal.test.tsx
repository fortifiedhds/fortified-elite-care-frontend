import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Enrolments } from "../../src/features/portal/admin/Enrolments";
import {
  AdminVisits,
  ExtraRequests,
} from "../../src/features/portal/admin/VisitManagement";
import {
  AssignedVisitDetail,
  AssignedVisits,
} from "../../src/features/portal/doctor/AssignedVisits";
import { AvailableVisits } from "../../src/features/portal/doctor/AvailableVisits";
import { Inbox } from "../../src/features/portal/notifications/Inbox";
import { Overview } from "../../src/features/portal/Overview";
import {
  PatientSummaries,
  PatientVisitDetail,
  PatientVisitList,
} from "../../src/features/portal/patient/Appointments";
import { PatientCheckups } from "../../src/features/portal/patient/PatientCheckups";
import { Portal } from "../../src/features/portal/Portal";
import { api } from "../../src/shared/api/client";
import {
  admin,
  dashboard,
  doctor,
  fail,
  ok,
  patient,
  pending,
  reply,
  runAction,
  today,
  view,
  visit,
} from "../fixtures";

const former = {
  ...visit,
  id: "old",
  date: "2099-06-01",
  status: "COMPLETED" as const,
  summary: "Approved summary",
};
const unaffiliated = {
  ...visit,
  id: "available",
  status: "AVAILABLE" as const,
  doctorName: undefined,
  doctorId: undefined,
};
const extra = {
  id: "extra",
  reason: "Extra checkup requested",
  approved: false,
  patientName: patient.name,
};
const notice = {
  id: "notice",
  message: "Care team update",
  availableAt: "2026-11-10T10:00:00Z",
  read: false,
};
const clinician = { ...admin, clinicalReviewer: true };

describe("portal deep links", () => {
  const record = { version: "test-form-v1", revision: 0, answers: {} };
  const definition = {
    version: record.version,
    sections: [{ title: "Form section", description: "", fields: [] }],
  };

  it.each(
    (
      [
        [patient, "/checkups", "Request a routine checkup"],
        [patient, "/appointments", "Upcoming appointments"],
        [patient, "/appointments/visit-1", "15 Jun 2099"],
        [patient, "/history", "Previous visits"],
        [patient, "/summaries", "Released summaries"],
        [patient, "/registration", "Form section"],
        [patient, "/baseline", "Form section"],
        [patient, "/consent", "Your care choices"],
        [patient, "/agreement", "Review your service agreement"],
        [patient, "/payments", "Compare care packages"],
        [patient, "/notifications", "Inbox"],
        [doctor, "/available", "Requests in your service area"],
        [doctor, "/assigned", "Your assigned visits"],
        [doctor, "/assigned/visit-1", "Consultation note"],
        [doctor, "/assigned/visit-1/baseline", "Form section"],
        [admin, "/enrolments", "Review enrolments"],
        [admin, "/enrolments/patient/review", "Official use"],
        [admin, "/visits", "Visit management"],
        [admin, "/extra-requests", "Additional checkup requests"],
        [admin, "/billing", "Package billing"],
      ] as const
    ).map(([account, path, heading]) => ({ account, path, heading })),
  )("$account.role can open $path", async ({ account, path, heading }) => {
    reply("GET", {
      "/dashboard": ok(dashboard(account, { visits: [visit] })),
      "/forms/{kind}/definition": ok(definition),
      "/patients/forms/{kind}": ok(record),
      "/patients/care-permissions": ok({
        version: "test-care-choices-v1",
        choices: {},
        recipients: [],
      }),
      "/visits/{id}/baseline": ok(record),
      "/admin/registrations/{id}": ok(record),
    });
    view(<Portal account={account} onSignOut={vi.fn()} />, "/portal" + path);
    expect(
      await screen.findByRole("heading", { name: heading, level: 2 }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Current route").textContent).toBe(
      "/portal" + path,
    );
  });

  it("returns a patient to their overview when given an admin link", async () => {
    const get = reply("GET", { "/dashboard": ok(dashboard(patient)) });
    view(
      <Portal account={patient} onSignOut={vi.fn()} />,
      "/portal/enrolments/patient/review",
    );
    await screen.findByRole("heading", { name: "Welcome, Test Patient" });
    expect(screen.getByLabelText("Current route").textContent).toBe("/portal");
    expect(get).not.toHaveBeenCalledWith(
      "/admin/registrations/{id}",
      expect.anything(),
    );
  });
});

describe("portal shell and overview", () => {
  it("renders role navigation, toggles the mobile menu and refreshes the workspace", async () => {
    const get = reply("GET", { "/dashboard": ok(dashboard(patient)) });
    view(<Portal account={patient} onSignOut={vi.fn()} />, "/portal");
    await screen.findByRole("heading", { name: "Welcome, Test Patient" });
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "Open portal navigation" }),
    );
    expect(
      screen
        .getByRole("button", { name: "Close portal navigation" })
        .getAttribute("aria-expanded"),
    ).toBe("true");
    await user.click(screen.getByRole("button", { name: "Refresh" }));
    expect(get).toHaveBeenCalledTimes(2);
    expect(await screen.findByText("Workspace refreshed.")).toBeTruthy();
  });

  it("logs out using the API and reports expired sessions during dashboard loading", async () => {
    const onSignOut = vi.fn();
    reply("GET", { "/dashboard": ok(dashboard(doctor)) });
    const post = reply("POST", { "/auth/logout": ok(true) });
    const wrapper = view(
      <Portal account={doctor} onSignOut={onSignOut} />,
      "/portal",
    );
    await screen.findByRole("heading", { name: "Welcome, Test Doctor" });
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Sign out" }));
    expect(post).toHaveBeenCalledWith("/auth/logout");
    expect(onSignOut).toHaveBeenCalledTimes(1);
    wrapper.unmount();
    reply("GET", { "/dashboard": fail(401, "Sign in to continue.") });
    view(<Portal account={doctor} onSignOut={onSignOut} />, "/portal");
    await waitFor(() => expect(onSignOut).toHaveBeenCalledTimes(2));
  });

  it("retries a failed dashboard request", async () => {
    let attempt = 0;
    reply("GET", {
      "/dashboard": () =>
        ++attempt === 1
          ? fail(503, "Care service unavailable")
          : ok(dashboard(admin)),
    });
    view(<Portal account={admin} onSignOut={vi.fn()} />, "/portal");
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Care service unavailable",
    );
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Retry" }));
    expect(
      await screen.findByRole("heading", { name: "Welcome, Test Admin" }),
    ).toBeTruthy();
  });

  it("presents the next assigned visit and the approved doctor welcome pack", () => {
    view(<Overview data={dashboard(doctor, { visits: [visit] })} />);
    expect(
      screen
        .getByRole("link", { name: "View visit details" })
        .getAttribute("href"),
    ).toBe("/portal/assigned/visit-1");
    expect(
      screen
        .getByRole("link", { name: /Download welcome pack/ })
        .getAttribute("href"),
    ).toMatch(/\/resources\/medical-officer-welcome$/);
  });
});

describe("patient checkups, appointments and summaries", () => {
  it("requests a routine visit, saves a preference and sends an extra-visit request", async () => {
    const post = reply("POST", {
      "/visits": ok(visit, 201),
      "/extra-visits": ok(true, 201),
    });
    const patch = reply("PATCH", { "/patients/preference": ok(true) });
    view(
      <PatientCheckups
        data={dashboard(patient, { preferredDate: "2099-06-19" })}
        act={runAction}
        busy={false}
      />,
    );
    const user = userEvent.setup();
    expect(
      (screen.getByLabelText("Visit date") as HTMLInputElement).value,
    ).toBe("2099-06-19");
    fireEvent.change(screen.getByLabelText("Visit date"), {
      target: { value: "2099-06-20" },
    });
    await user.click(screen.getByRole("button", { name: "Request checkup" }));
    expect(post).toHaveBeenCalledWith("/visits", {
      body: { date: "2099-06-20" },
    });
    await user.click(screen.getByRole("button", { name: "Save as preferred" }));
    expect(patch).toHaveBeenCalledWith("/patients/preference", {
      body: { date: "2099-06-20" },
    });
    await user.type(screen.getByLabelText("Reason"), extra.reason);
    await user.click(screen.getByRole("button", { name: "Send request" }));
    expect(post).toHaveBeenCalledWith("/extra-visits", {
      body: { reason: extra.reason },
    });
    expect((screen.getByLabelText("Reason") as HTMLTextAreaElement).value).toBe(
      "",
    );
  });

  it("disables visit requests for pending accounts and falls back from an outdated preference", () => {
    view(
      <PatientCheckups
        data={dashboard(pending(patient), {
          preferredDate: "2000-01-01",
          support: [extra],
        })}
        act={runAction}
        busy={false}
      />,
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Request checkup",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Send request",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (screen.getByLabelText("Visit date") as HTMLInputElement).value,
    ).toBe(today);
    expect(screen.getByText("In review")).toBeTruthy();
  });

  it("separates upcoming and past appointments and exposes only released summaries", () => {
    const data = dashboard(patient, { visits: [former, visit] });
    const wrapper = view(<PatientVisitList data={data} />);
    expect(
      screen
        .getAllByRole("link", { name: "View visit details" })
        .map((a) => a.getAttribute("href")),
    ).toEqual(["/portal/appointments/visit-1"]);
    wrapper.unmount();
    const history = view(<PatientVisitList data={data} history />);
    expect(
      screen
        .getByRole("link", { name: "View visit details" })
        .getAttribute("href"),
    ).toBe("/portal/appointments/old");
    history.unmount();
    view(
      <>
        <PatientVisitDetail data={data} id="missing" />
        <PatientVisitDetail data={data} id="old" />
        <PatientSummaries data={data} />
      </>,
    );
    expect(
      screen.getByRole("heading", { name: "Visit unavailable" }),
    ).toBeTruthy();
    expect(screen.getAllByText("Approved summary")).toHaveLength(2);
  });
});

describe("doctor claim and consultation", () => {
  it("asks for confirmation before claiming an anonymous visit", async () => {
    const post = reply("POST", { "/visits/{id}/claim": ok(true, 201) });
    view(
      <AvailableVisits
        data={dashboard(doctor, { available: [unaffiliated] })}
        act={runAction}
        busy={false}
      />,
    );
    const user = userEvent.setup();
    expect(screen.queryByText(patient.name)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Review request" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(post).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Review request" }));
    await user.click(screen.getByRole("button", { name: "Confirm claim" }));
    expect(post).toHaveBeenCalledWith("/visits/{id}/claim", {
      params: { path: { id: unaffiliated.id } },
    });
  });

  it("navigates to an assigned visit and opens documentation only on or after the scheduled date", () => {
    const data = dashboard(doctor, {
      visits: [{ ...visit, date: "2099-07-15" }],
    });
    view(
      <>
        <AssignedVisits data={data} />
        <AssignedVisitDetail
          data={data}
          id={visit.id}
          act={runAction}
          busy={false}
        />
      </>,
    );
    expect(
      screen.getByRole("link", { name: "Open visit" }).getAttribute("href"),
    ).toBe("/portal/assigned/visit-1");
    expect(
      screen.getByText("Documentation opens on the visit date."),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Private observations")).toBeNull();
  });

  it("saves a draft, requires both fields to sign, and submits the signed note on explicit confirmation", async () => {
    reply("GET", {
      "/forms/{kind}/definition": ok({ version: "v1", sections: [] }),
    });
    const patch = reply("PATCH", { "/visits/{id}/note": ok(true) });
    const post = reply("POST", { "/visits/{id}/sign": ok(true, 201) });
    view(
      <AssignedVisitDetail
        data={dashboard(doctor, { visits: [visit] })}
        id={visit.id}
        act={runAction}
        busy={false}
      />,
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "Sign and complete visit" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirm signature" }));
    expect(screen.getByRole("alert").textContent).toMatch(
      /observations and a summary/,
    );
    expect(post).not.toHaveBeenCalled();
    await user.type(
      screen.getByLabelText("Private observations"),
      "Private test note",
    );
    await user.type(
      screen.getByLabelText("Patient summary"),
      "Released after review",
    );
    const request = {
      params: { path: { id: visit.id } },
      body: {
        observations: "Private test note",
        summary: "Released after review",
        structured: {},
      },
    };
    await user.click(screen.getByRole("button", { name: "Save draft" }));
    expect(patch).toHaveBeenCalledWith("/visits/{id}/note", request);
    await user.click(
      screen.getByRole("button", { name: "Sign and complete visit" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirm signature" }));
    expect(post).toHaveBeenCalledWith("/visits/{id}/sign", request);
  });

  it("shows signed consultation details without an edit form", async () => {
    reply("GET", {
      "/forms/{kind}/definition": ok({ version: "v1", sections: [] }),
      "/visits/{id}/addenda": ok([]),
    });
    view(
      <AssignedVisitDetail
        data={dashboard(doctor, {
          visits: [{ ...former, hasSignedNote: true, published: true }],
        })}
        id={former.id}
        act={runAction}
        busy={false}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Signed consultation note" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save draft" })).toBeNull();
    expect(await screen.findByText("No addenda yet.")).toBeTruthy();
  });
});

describe("admin operations and notifications", () => {
  const reviewed = {
    id: doctor.id,
    name: doctor.name,
    area: "Central",
    role: doctor.role,
    reviewStatus: doctor.reviewStatus,
  };
  it("filters enrolments, links to the registration review and approves a pending account", async () => {
    const patch = reply("PATCH", {
      "/admin/enrolments/{id}/approve": ok(true),
    });
    view(
      <Enrolments
        data={dashboard(admin, {
          enrolments: [
            {
              id: patient.id,
              name: patient.name,
              role: patient.role,
              area: "Central",
              reviewStatus: "PENDING",
            },
            reviewed,
          ],
        })}
        act={runAction}
        busy={false}
      />,
    );
    expect(screen.queryByRole("heading", { name: doctor.name })).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "View submitted registration" })
        .getAttribute("href"),
    ).toBe("/portal/enrolments/patient/review");
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Show"), "ALL");
    expect(screen.getByRole("heading", { name: doctor.name })).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Approve Test Patient" }),
    );
    expect(patch).toHaveBeenCalledWith("/admin/enrolments/{id}/approve", {
      params: { path: { id: patient.id } },
    });
  });

  it("limits assignment choices by approval and area and releases notes only for reviewers", async () => {
    const data = dashboard(clinician, {
      enrolments: [
        reviewed,
        { ...reviewed, id: "other", area: "Other", name: "Other Doctor" },
        {
          ...reviewed,
          id: "pending",
          reviewStatus: "PENDING",
          name: "Pending Doctor",
        },
      ],
      visits: [
        unaffiliated,
        { ...former, hasSignedNote: true, published: false },
      ],
    });
    const patch = reply("PATCH", { "/admin/visits/{id}/assignment": ok(true) });
    const post = reply("POST", { "/admin/visits/{id}/publish": ok(true, 201) });
    const wrapper = view(
      <AdminVisits data={data} act={runAction} busy={false} />,
    );
    const user = userEvent.setup();
    const select = screen.getByLabelText("Assign doctor");
    expect(
      within(select).queryByRole("option", { name: "Other Doctor" }),
    ).toBeNull();
    expect(
      within(select).queryByRole("option", { name: "Pending Doctor" }),
    ).toBeNull();
    await user.selectOptions(select, doctor.id);
    await user.click(screen.getByRole("button", { name: "Save assignment" }));
    expect(patch).toHaveBeenCalledWith("/admin/visits/{id}/assignment", {
      params: { path: { id: unaffiliated.id } },
      body: { doctorId: doctor.id },
    });
    await user.click(screen.getByRole("button", { name: "Release summary" }));
    expect(post).toHaveBeenCalledWith("/admin/visits/{id}/publish", {
      params: { path: { id: former.id } },
    });
    wrapper.unmount();
    view(
      <AdminVisits
        data={{ ...data, account: admin }}
        act={runAction}
        busy={false}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Release summary" }),
    ).toBeNull();
  });

  it("sends an extra-visit decision and acknowledges only unread notifications", async () => {
    const post = reply("POST", {
      "/admin/extra-visits/{id}/approve": ok(true, 201),
    });
    const patch = reply("PATCH", { "/notifications/{id}/read": ok(true) });
    view(
      <>
        <ExtraRequests
          data={dashboard(admin, { support: [extra] })}
          act={runAction}
          busy={false}
        />
        <Inbox
          data={dashboard(admin, {
            notifications: [notice, { ...notice, id: "old", read: true }],
          })}
          act={runAction}
          busy={false}
        />
      </>,
    );
    fireEvent.change(screen.getByLabelText("Visit date"), {
      target: { value: today },
    });
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("Decision note"),
      "Approved by the team",
    );
    await user.click(
      screen.getByRole("button", { name: "Approve extra visit" }),
    );
    expect(post).toHaveBeenCalledWith("/admin/extra-visits/{id}/approve", {
      params: { path: { id: extra.id } },
      body: { date: today, decision: "Approved by the team" },
    });
    await user.click(screen.getByRole("button", { name: "Mark as read" }));
    expect(patch).toHaveBeenCalledWith("/notifications/{id}/read", {
      params: { path: { id: notice.id } },
    });
    expect(api.PATCH).toHaveBeenCalledTimes(1);
  });
});
