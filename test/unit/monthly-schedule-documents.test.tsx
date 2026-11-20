import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CareDocuments } from "../../src/features/files/CareDocuments";
import { PatientCheckups } from "../../src/features/portal/patient/PatientCheckups";
import { Portal } from "../../src/features/portal/Portal";
import {
  monthlyDays,
  nextVisitMonth,
  ordinal,
  visitDate,
} from "../../src/shared/lib/monthly-schedule";
import { api, apiBase } from "../../src/shared/api/client";
import {
  dashboard,
  doctor,
  patient,
  pending,
  ok,
  reply,
  runAction,
  view,
} from "../fixtures";

describe("monthly day preferences", () => {
  it("offers all 31 days with readable ordinal labels", () => {
    expect(monthlyDays).toHaveLength(31);
    expect([1, 2, 3, 11, 12, 13, 21, 22, 23, 31].map(ordinal)).toEqual([
      "1st",
      "2nd",
      "3rd",
      "11th",
      "12th",
      "13th",
      "21st",
      "22nd",
      "23rd",
      "31st",
    ]);
  });
  it("uses the last day in short months, including leap years", () => {
    expect(visitDate("2027-02", 31)).toBe("2027-02-28");
    expect(visitDate("2028-02", 31)).toBe("2028-02-29");
    expect(visitDate("2100-02", 31)).toBe("2100-02-28");
    expect(visitDate("2000-02", 31)).toBe("2000-02-29");
    expect(visitDate("2027-04", 31)).toBe("2027-04-30");
    expect(visitDate("2027-05", 31)).toBe("2027-05-31");
    expect(visitDate("2027-13", 31)).toBeUndefined();
    expect(visitDate("2027-02", 32)).toBeUndefined();
  });
  it("chooses the next applicable month and skips already-requested months across years", () => {
    expect(nextVisitMonth("2027-02-28", 31)).toBe("2027-02");
    expect(nextVisitMonth("2027-02-20", 15)).toBe("2027-03");
    expect(nextVisitMonth("2027-12-31", 31, ["2027-12", "2028-01"])).toBe(
      "2028-02",
    );
  });
  it("saves a recurring day and previews the actual last-day appointment without implying confirmation", async () => {
    const patch = reply("PATCH", { "/patients/preference": ok(true) });
    const post = reply("POST", { "/visits": ok({}) });
    view(
      <PatientCheckups
        data={dashboard(patient, {
          serviceToday: "2027-02-01",
          preferredDayOfMonth: 31,
        })}
        act={runAction}
        busy={false}
      />,
    );
    expect(
      screen.getByText(/In shorter months, we use the last day/),
    ).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("28 Feb 2027");
    expect(screen.getByRole("status").textContent).toContain(
      "this shorter month uses its last day",
    );
    fireEvent.click(screen.getByRole("button", { name: "Request checkup" }));
    expect(post).toHaveBeenCalledWith("/visits", {
      body: { month: "2027-02" },
    });
    fireEvent.change(screen.getByLabelText("Preferred monthly visit day"), {
      target: { value: "30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save monthly day" }));
    expect(patch).toHaveBeenCalledWith("/patients/preference", {
      body: { dayOfMonth: 30 },
    });
  });
  it("requires a saved preference before booking and leaves pending patients unable to request visits", () => {
    view(
      <PatientCheckups
        data={dashboard(pending(patient), { preferredDayOfMonth: undefined })}
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
      screen.getByText("Choose and save your monthly visit day first."),
    ).toBeTruthy();
  });
});
describe("care records instead of personal file storage", () => {
  it("shows digital patient records without uploading or requesting private files", async () => {
    reply("GET", { "/dashboard": ok(dashboard(patient)) });
    view(<Portal account={patient} onSignOut={vi.fn()} />, "/portal/documents");
    await screen.findByRole("heading", { name: "Your care records" });
    expect(
      screen
        .getByRole("link", { name: "Open client registration" })
        .getAttribute("href"),
    ).toBe("/portal/registration");
    expect(
      screen
        .getByRole("link", { name: "Open care permissions" })
        .getAttribute("href"),
    ).toBe("/portal/consent");
    expect(screen.queryByText("Your private documents")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Upload document" }),
    ).toBeNull();
    expect(api.GET).not.toHaveBeenCalledWith("/files", expect.anything());
  });
  it("takes approved doctors to digital visit notes and offers the welcome PDF", () => {
    view(<CareDocuments account={doctor} />);
    expect(
      screen
        .getByRole("link", { name: "Open consultation notes and assessments" })
        .getAttribute("href"),
    ).toBe("/portal/assigned");
    expect(
      screen
        .getByRole("link", { name: "Download welcome pack (PDF)" })
        .getAttribute("href"),
    ).toBe(apiBase + "/resources/medical-officer-welcome");
    expect(
      screen.queryByRole("button", { name: "Upload document" }),
    ).toBeNull();
  });
  it("keeps restricted clinical resources unavailable before doctor approval", () => {
    view(<CareDocuments account={pending(doctor)} />);
    expect(
      screen.queryByRole("link", { name: "Download welcome pack (PDF)" }),
    ).toBeNull();
    expect(
      screen.queryByRole("link", {
        name: "Open consultation notes and assessments",
      }),
    ).toBeNull();
  });
});
