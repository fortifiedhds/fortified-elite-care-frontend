import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";
import { Login } from "../../src/features/auth/Login";
import { Register } from "../../src/features/auth/Register";
import { GoogleOnboarding } from "../../src/features/auth/GoogleOnboarding";
import { VerificationForm } from "../../src/features/auth/VerificationForm";
import { Settings } from "../../src/features/settings/Settings";
import { Documents } from "../../src/features/files/Documents";
import { Administrators } from "../../src/features/portal/admin/Administrators";
import { Portal } from "../../src/features/portal/Portal";
import { adminConsolePath } from "../../src/shared/lib/admin";
import { apiBase, UserFacingError } from "../../src/shared/api/client";
import {
  admin,
  dashboard,
  doctor,
  fail,
  ok,
  patient,
  pending,
  reply,
  signupChallenge,
  today,
  view,
} from "../fixtures";

const change = (name: string, value: string) =>
  fireEvent.change(screen.getByLabelText(name), { target: { value } });

describe("Google login and first-time onboarding", () => {
  it("offers Google on login and leaves email registration with its own account form", async () => {
    reply("GET", {
      "/auth/providers": ok({ google: true, email: true, uploads: true }),
    });
    const first = view(<Login account={null} onAccount={vi.fn()} />);
    expect(
      (
        await screen.findByRole("link", { name: "Continue with Google" })
      ).getAttribute("href"),
    ).toBe(apiBase + "/auth/google");
    first.unmount();
    view(
      <Register account={null} onAccount={vi.fn()} />,
      "/register?role=doctor",
    );
    expect(
      screen.queryByRole("link", { name: "Continue with Google" }),
    ).toBeNull();
    expect(screen.getByLabelText(/Password/)).toBeTruthy();
  });

  it("shows a provider failure and the friendly passwordless sign-in guidance", async () => {
    reply("POST", {
      "/auth/login": fail(
        401,
        "This account uses Google sign-in. Continue with Google, then create a password in Settings.",
      ),
    });
    view(<Login account={null} onAccount={vi.fn()} />, "/login?google=failed");
    expect(screen.getByRole("alert").textContent).toMatch(
      /could not be completed/,
    );
    change("Email address", doctor.email);
    change("Password", "synthetic passphrase");
    fireEvent.submit(
      screen.getByRole("button", { name: "Sign in" }).closest("form")!,
    );
    expect(
      (await screen.findByText(/This account uses Google sign-in/)).textContent,
    ).toMatch(/create a password in Settings/);
  });

  it("collects doctor credentials after Google with a locked email and no password field", async () => {
    const onAccount = vi.fn();
    reply("GET", {
      "/auth/google/profile": ok({ name: doctor.name, email: doctor.email }),
    });
    const post = reply("POST", {
      "/auth/google/register/doctor": ok({ account: pending(doctor) }, 201),
    });
    view(
      <GoogleOnboarding account={null} onAccount={onAccount} />,
      "/google/onboarding",
    );
    await screen.findByRole("heading", { name: "Create an account" });
    fireEvent.click(screen.getByRole("radio", { name: "Doctor" }));
    expect(
      (screen.getByLabelText("Email address") as HTMLInputElement).readOnly,
    ).toBe(true);
    expect(screen.queryByLabelText(/Password/)).toBeNull();
    change("Area you cover for home visits", "Central");
    change("Professional registration or licence number", "MDCN123");
    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));
    await waitFor(() =>
      expect(onAccount).toHaveBeenCalledWith(pending(doctor)),
    );
    expect(post).toHaveBeenCalledWith("/auth/google/register/doctor", {
      body: { name: doctor.name, area: "Central", credentialId: "MDCN123" },
    });
  });

  it("collects patient scheduling and explicit care choices for Google onboarding", async () => {
    const onAccount = vi.fn();
    const post = reply("POST", {
      "/auth/google/register/patient": ok({ account: pending(patient) }),
    });
    view(
      <Register
        account={null}
        onAccount={onAccount}
        googleProfile={{ name: patient.name, email: patient.email }}
      />,
      "/google/onboarding",
    );
    fireEvent.click(screen.getByRole("radio", { name: "Patient" }));
    change("Area where you live", "Central");
    change("Preferred monthly visit day", "15");
    fireEvent.click(
      screen.getByRole("button", { name: /Continue to care permissions/ }),
    );
    for (const group of screen.getAllByRole("group"))
      fireEvent.click(within(group).getByRole("radio", { name: "Yes" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));
    await waitFor(() =>
      expect(onAccount).toHaveBeenCalledWith(pending(patient)),
    );
    expect(post).toHaveBeenCalledWith("/auth/google/register/patient", {
      body: expect.objectContaining({
        preferredDayOfMonth: 15,
        homeVisits: true,
      }),
    });
    expect(post.mock.calls[0]?.[1]).not.toHaveProperty("body.password");
    expect(post.mock.calls[0]?.[1]).not.toHaveProperty("body.email");
  });
});

describe("verification and password settings", () => {
  it("shows incorrect codes, allows a new code and sends the six digits for confirmation", async () => {
    const verify = vi
      .fn()
      .mockRejectedValueOnce(new UserFacingError("Incorrect code"))
      .mockResolvedValue(undefined);
    const post = reply("POST", { "/auth/resend": ok(signupChallenge) });
    view(<VerificationForm initial={signupChallenge} verify={verify} />);
    change("Verification code", "123456");
    fireEvent.click(screen.getByRole("button", { name: "Verify code" }));
    expect(await screen.findByText("Incorrect code")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    expect(await screen.findByText("A new code has been sent.")).toBeTruthy();
    expect(post).toHaveBeenCalledWith("/auth/resend");
    change("Verification code", "654321");
    fireEvent.click(screen.getByRole("button", { name: "Verify code" }));
    await waitFor(() => expect(verify).toHaveBeenLastCalledWith("654321"));
  });

  it("disables verification after expiry and prevents resending during the cooldown", () => {
    const first = view(
      <VerificationForm
        initial={{ ...signupChallenge, expiresAt: "2000-01-01T00:00:00Z" }}
        verify={vi.fn()}
      />,
    );
    expect(
      (screen.getByRole("button", { name: "Verify code" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(screen.getByRole("alert").textContent).toMatch(/expired/);
    first.unmount();
    view(
      <VerificationForm
        initial={{
          ...signupChallenge,
          resendAt: new Date(Date.now() + 60_000).toISOString(),
        }}
        verify={vi.fn()}
      />,
    );
    expect(
      (screen.getByRole("button", { name: /Resend in/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("creates a Google user's password after OTP without requesting an existing password", async () => {
    let saved = false;
    reply("GET", {
      "/auth/security": () =>
        ok({ hasPassword: saved, googleLinked: true, emailVerified: true }),
    });
    const post = reply("POST", {
      "/auth/password": ok({ ...signupChallenge, purpose: "PASSWORD_CHANGE" }),
      "/auth/password/confirm": () => {
        saved = true;
        return ok(true);
      },
    });
    view(<Settings />);
    await screen.findByText("Google is connected to your account.");
    expect(screen.queryByLabelText("Current password")).toBeNull();
    change("New password", "new synthetic passphrase");
    change("Confirm new password", "new synthetic passphrase");
    fireEvent.click(
      screen.getByRole("button", { name: "Send verification code" }),
    );
    await screen.findByLabelText("Verification code");
    change("Verification code", "123456");
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm password update" }),
    );
    await screen.findByRole("heading", { name: "Change password" });
    expect(post).toHaveBeenCalledWith("/auth/password", {
      body: { newPassword: "new synthetic passphrase" },
    });
    expect(post).toHaveBeenCalledWith("/auth/password/confirm", {
      body: { code: "123456" },
    });
  });

  it("requires matching passwords and includes the current password for a password account", async () => {
    reply("GET", {
      "/auth/security": ok({
        hasPassword: true,
        googleLinked: false,
        emailVerified: true,
      }),
    });
    const post = reply("POST", {
      "/auth/password": fail(401, "Your current password is incorrect."),
    });
    view(<Settings />);
    await screen.findByLabelText("Current password");
    change("Current password", "current passphrase");
    change("New password", "new synthetic passphrase");
    change("Confirm new password", "different synthetic password");
    fireEvent.click(
      screen.getByRole("button", { name: "Send verification code" }),
    );
    expect(screen.getByRole("alert").textContent).toBe(
      "Your new passwords do not match.",
    );
    expect(post).not.toHaveBeenCalled();
    change("Confirm new password", "new synthetic passphrase");
    fireEvent.click(
      screen.getByRole("button", { name: "Send verification code" }),
    );
    expect(
      await screen.findByText("Your current password is incorrect."),
    ).toBeTruthy();
    expect(post).toHaveBeenCalledWith("/auth/password", {
      body: {
        currentPassword: "current passphrase",
        newPassword: "new synthetic passphrase",
      },
    });
  });
});

describe("administrator console and private files", () => {
  it("returns administrators to their console when a verification request has expired", async () => {
    reply("GET", {
      "/auth/me": fail(401, "Sign in to continue."),
      "/auth/challenge": fail(
        401,
        "Your code has expired. Start the request again.",
      ),
    });
    view(<App />, "/verify-email?admin=1");
    expect(
      await screen.findByText(
        "Your code has expired. Start the request again.",
      ),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Back to sign in" })
        .getAttribute("href"),
    ).toBe(adminConsolePath);
  });
  it("uses the generated console route and sends admin sign-in through email verification", async () => {
    reply("GET", {
      "/auth/me": fail(401, "Sign in to continue."),
      "/auth/challenge": ok({ ...signupChallenge, purpose: "ADMIN_LOGIN" }),
    });
    const post = reply("POST", {
      "/auth/admin/login": ok({
        challenge: { ...signupChallenge, purpose: "ADMIN_LOGIN" },
      }),
    });
    view(<App />, adminConsolePath);
    await screen.findByRole("heading", { name: "Administrator sign in." });
    expect(
      screen.queryByRole("link", { name: "Continue with Google" }),
    ).toBeNull();
    change("Email address", admin.email);
    change("Password", "admin synthetic passphrase");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByRole("heading", { name: "Check your email." });
    expect(post).toHaveBeenCalledWith("/auth/admin/login", {
      body: { email: admin.email, password: "admin synthetic passphrase" },
    });
  });

  it("hides unauthorized queues while retaining settings for a restricted administrator", async () => {
    const restricted = { ...admin, adminPermissions: [] };
    reply("GET", { "/dashboard": ok(dashboard(restricted)) });
    view(
      <Portal
        account={restricted}
        onSignOut={vi.fn()}
        basePath={adminConsolePath}
      />,
      adminConsolePath,
    );
    await screen.findByRole("heading", { name: "Welcome, Test Admin" });
    fireEvent.click(
      screen.getByRole("button", { name: "Open portal navigation" }),
    );
    expect(screen.queryByRole("link", { name: "Administrators" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Enrolments" })).toBeNull();
    expect(
      screen.getByRole("link", { name: "Settings" }).getAttribute("href"),
    ).toBe(adminConsolePath + "/settings");
  });

  it("creates a separate admin only after the current administrator confirms an OTP", async () => {
    reply("GET", { "/admin/accounts": ok([]) });
    const post = reply("POST", {
      "/admin/accounts": ok({ ...signupChallenge, purpose: "ADMIN_CHANGE" }),
      "/admin/accounts/confirm": ok(true),
    });
    const refresh = vi.fn(async () => undefined);
    view(<Administrators refresh={refresh} />);
    change("Administrator name", "New administrator");
    change("Administrator email", "new-admin@example.test");
    change("Initial password", "initial synthetic passphrase");
    fireEvent.click(screen.getByRole("checkbox", { name: "Manage visits" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Send verification code" }),
    );
    await screen.findByLabelText("Verification code");
    expect(post).not.toHaveBeenCalledWith(
      "/admin/accounts/confirm",
      expect.anything(),
    );
    change("Verification code", "123456");
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm administrator change" }),
    );
    await screen.findByText("Administrator access has been saved.");
    expect(post).toHaveBeenCalledWith("/admin/accounts", {
      body: {
        name: "New administrator",
        email: "new-admin@example.test",
        password: "initial synthetic passphrase",
        permissions: ["VISITS_MANAGE"],
      },
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("lists private documents and rejects oversized uploads before sending them", async () => {
    reply("GET", {
      "/files": ok([
        {
          id: "file",
          name: "test.pdf",
          bytes: 1024,
          format: "pdf",
          createdAt: "2026-11-19T10:00:00Z",
        },
      ]),
    });
    const fetch = vi.spyOn(globalThis, "fetch");
    view(<Documents />);
    expect(
      (await screen.findByRole("link", { name: "test.pdf" })).getAttribute(
        "href",
      ),
    ).toBe(apiBase + "/files/file/download");
    const file = new File(["%PDF-test"], "large.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(file, "size", { value: 11 * 1024 * 1024 });
    fireEvent.change(screen.getByLabelText("Choose a document"), {
      target: { files: [file] },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Upload document" }).closest("form")!,
    );
    expect(screen.getByRole("alert").textContent).toBe(
      "Choose a file up to 10 MB.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uploads a document with credentials, refreshes its metadata and clears the picker", async () => {
    let uploaded = false;
    const metadata = {
      id: "new-file",
      name: "new.pdf",
      bytes: 12,
      format: "pdf",
      createdAt: "2026-11-19T10:00:00Z",
    };
    reply("GET", { "/files": () => ok(uploaded ? [metadata] : []) });
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      uploaded = true;
      return new Response(JSON.stringify(metadata), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    });
    view(<Documents />);
    await screen.findByText("Your uploaded documents will appear here.");
    fireEvent.change(screen.getByLabelText("Choose a document"), {
      target: {
        files: [new File(["%PDF-1.7"], "new.pdf", { type: "application/pdf" })],
      },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Upload document" }).closest("form")!,
    );
    await screen.findByText("Your document is uploaded.");
    expect(screen.getByRole("link", { name: "new.pdf" })).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith(
      apiBase + "/files",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: expect.any(FormData),
      }),
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Upload document",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});
