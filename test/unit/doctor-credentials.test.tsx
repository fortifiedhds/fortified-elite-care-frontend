import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DoctorCredentials } from "../../src/features/doctor-credentials/DoctorCredentials";
import { Register } from "../../src/features/auth/Register";
import { VerifyEmail } from "../../src/features/auth/VerifyEmail";
import { Portal } from "../../src/features/portal/Portal";
import { apiBase } from "../../src/shared/api/client";
import type { components } from "../../src/shared/api/schema";
import { adminConsolePath, isAppRoute } from "../../src/shared/lib/routes";
import {
  admin,
  doctor,
  pending,
  view,
  reply,
  ok,
  fail,
  dashboard,
  signupChallenge,
} from "../fixtures";
const application: components["schemas"]["DoctorCredentialsView"] = {
  doctorId: doctor.id,
  name: doctor.name,
  credentialId: "MDCN123",
  reviewStatus: "PENDING",
  revision: 0,
  submittedAt: null,
  certificates: [],
};
const complete: typeof application = {
  ...application,
  revision: 1,
  submittedAt: "2026-11-23T08:00:00Z",
  certificates: [
    { kind: "MEDICAL_DEGREE", name: "degree.pdf", bytes: 1024, format: "pdf" },
    { kind: "MDCN_REGISTRATION", name: "mdcn.pdf", bytes: 2048, format: "pdf" },
  ],
};
async function choose() {
  const user = userEvent.setup();
  await user.upload(
    await screen.findByLabelText(/University Medical Certificate.*required/),
    new File(["%PDF-degree"], "degree.pdf", { type: "application/pdf" }),
  );
  await user.upload(
    screen.getByLabelText(/MDCN Certificate of Registration.*required/),
    new File(["%PDF-mdcn"], "mdcn.pdf", { type: "application/pdf" }),
  );
}
describe("doctor application certificates", () => {
  it.each([undefined, { name: doctor.name, email: doctor.email }])(
    "sends a pending password or Google doctor to certificate completion (%s)",
    (googleProfile) => {
      view(
        <Register
          account={pending(doctor)}
          onAccount={vi.fn()}
          googleProfile={googleProfile}
        />,
        "/register?role=doctor",
      );
      expect(
        screen.getByRole("note", { name: "Current route" }).textContent,
      ).toBe("/portal/credentials");
    },
  );
  it("opens certificate completion after successful doctor signup verification", async () => {
    reply("GET", {
      "/auth/challenge": ok({ ...signupChallenge, email: doctor.email }),
    });
    reply("POST", { "/auth/verify": ok({ account: pending(doctor) }) });
    const onAccount = vi.fn();
    view(<VerifyEmail onAccount={onAccount} />, "/verify-email");
    fireEvent.change(await screen.findByLabelText("Verification code"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify code" }));
    await waitFor(() =>
      expect(
        screen.getByRole("note", { name: "Current route" }).textContent,
      ).toBe("/portal/credentials"),
    );
    expect(onAccount).toHaveBeenCalledWith(pending(doctor));
  });
  it("requires both fields and submits one authenticated multipart request", async () => {
    reply("GET", { "/doctors/credentials": ok(application) });
    const upload = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(complete), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    );
    view(<DoctorCredentials />);
    const button = await screen.findByRole("button", {
      name: "Submit both certificates",
    });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    await choose();
    fireEvent.submit(button.closest("form")!);
    await screen.findByText(/Both certificates have been submitted/);
    expect(upload).toHaveBeenCalledTimes(1);
    const [url, options] = upload.mock.calls[0];
    expect(url).toBe(apiBase + "/doctors/credentials");
    expect(options?.credentials).toBe("include");
    const body = options?.body as FormData;
    expect((body.get("medicalDegree") as File).name).toBe("degree.pdf");
    expect((body.get("mdcnRegistration") as File).name).toBe("mdcn.pdf");
  });
  it("rejects oversized files before contacting storage", async () => {
    reply("GET", { "/doctors/credentials": ok(application) });
    const upload = vi.spyOn(globalThis, "fetch");
    view(<DoctorCredentials />);
    await choose();
    const large = new File(["x"], "large.pdf");
    Object.defineProperty(large, "size", { value: 11 * 1024 * 1024 });
    await userEvent
      .setup()
      .upload(
        screen.getByLabelText(/University Medical Certificate.*required/),
        large,
      );
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Submit both certificates" })
        .closest("form")!,
    );
    await screen.findByText("Choose both certificates, up to 10 MB each.");
    expect(upload).not.toHaveBeenCalled();
  });
  it("allows retry after a failed upload without clearing the selected files", async () => {
    reply("GET", { "/doctors/credentials": ok(application) });
    const upload = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "internal database details" }), {
        status: 503,
      }),
    );
    view(<DoctorCredentials />);
    await choose();
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Submit both certificates" })
        .closest("form")!,
    );
    await screen.findByText(/couldn’t complete your request/);
    expect(screen.queryByText(/internal database/)).toBeNull();
    await waitFor(() =>
      expect(
        (
          screen.getByRole("button", {
            name: "Submit both certificates",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false),
    );
    expect(upload).toHaveBeenCalledTimes(1);
  });
  it("shows downloads for approved doctors and keeps replacement closed", async () => {
    reply("GET", {
      "/doctors/credentials": ok({ ...complete, reviewStatus: "APPROVED" }),
    });
    view(<DoctorCredentials />);
    const link = await screen.findByRole("link", {
      name: "Open University Medical Certificate",
    });
    expect(link.getAttribute("href")).toBe(
      apiBase + "/doctors/credentials/MEDICAL_DEGREE/download",
    );
    expect(screen.queryByLabelText(/required/)).toBeNull();
  });
  it("blocks admin approval with missing files", async () => {
    reply("GET", { "/admin/doctors/{id}/credentials": ok(application) });
    view(<DoctorCredentials doctorId={doctor.id} />);
    expect(
      (
        (await screen.findByRole("button", {
          name: "Approve doctor",
        })) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect((screen.getByRole("checkbox") as HTMLInputElement).disabled).toBe(
      true,
    );
  });
  it("requires explicit review and submits the reviewed revision", async () => {
    reply("GET", { "/admin/doctors/{id}/credentials": ok(complete) });
    const patch = reply("PATCH", {
      "/admin/enrolments/{id}/approve": ok(true),
    });
    view(<DoctorCredentials doctorId={doctor.id} />);
    const button = await screen.findByRole("button", {
      name: "Approve doctor",
    });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(button);
    await screen.findByText("Doctor application approved.");
    expect(patch).toHaveBeenCalledWith("/admin/enrolments/{id}/approve", {
      params: { path: { id: doctor.id } },
      body: { credentialsRevision: 1 },
    });
  });
  it("clears review acknowledgement and reloads on stale approval", async () => {
    let current = complete;
    reply("GET", { "/admin/doctors/{id}/credentials": () => ok(current) });
    reply("PATCH", {
      "/admin/enrolments/{id}/approve": () => {
        current = { ...complete, revision: 2 };
        return fail(
          409,
          "The certificates have changed. Review the latest files before approving this doctor.",
        );
      },
    });
    view(<DoctorCredentials doctorId={doctor.id} />);
    await screen.findByRole("checkbox");
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Approve doctor" }));
    await screen.findByText(/The certificates have changed/);
    await screen.findByText(/Version 2/);
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
      false,
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Approve doctor",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
  it("routes doctor completion and admin review through the correct portal navigation", async () => {
    expect(isAppRoute("/portal/credentials", "dashboard")).toBe(true);
    expect(
      isAppRoute(adminConsolePath + "/enrolments/doctor/credentials", "admin"),
    ).toBe(true);
    expect(
      isAppRoute(adminConsolePath + "/enrolments/doctor/credentials", "public"),
    ).toBe(false);
    reply("GET", {
      "/dashboard": ok(dashboard(pending(doctor))),
      "/doctors/credentials": ok(application),
    });
    view(
      <Portal account={pending(doctor)} onSignOut={vi.fn()} />,
      "/portal/credentials",
    );
    await screen.findByRole("heading", { name: "Your medical certificates" });
    expect(
      screen
        .getByRole("link", { name: "My application", hidden: true })
        .getAttribute("aria-current"),
    ).toBe("page");
  });
  it("loads the doctor review inside the admin console", async () => {
    reply("GET", {
      "/dashboard": ok(dashboard(admin)),
      "/admin/doctors/{id}/credentials": ok(complete),
    });
    view(
      <Portal
        account={admin}
        onSignOut={vi.fn()}
        basePath={adminConsolePath}
      />,
      adminConsolePath + "/enrolments/doctor/credentials",
    );
    await screen.findByRole("heading", { name: "Doctor application review" });
    await screen.findByRole("link", {
      name: "Open MDCN Certificate of Registration",
    });
  });
});
