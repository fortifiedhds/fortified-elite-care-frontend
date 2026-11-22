import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";
import { Login } from "../../src/features/auth/Login";
import { ForgotPassword } from "../../src/features/auth/ForgotPassword";
import { ResetPassword } from "../../src/features/auth/ResetPassword";
import { adminConsolePath, isAppRoute } from "../../src/shared/lib/routes";
import { api } from "../../src/shared/api/client";
import { fail, ok, reply, signupChallenge, view } from "../fixtures";
const challenge = { ...signupChallenge, purpose: "PASSWORD_RESET" as const };
const grant = { expiresAt: "2099-06-15T12:00:00Z", admin: false };
const change = (name: string, value: string) =>
  fireEvent.change(screen.getByLabelText(name), { target: { value } });
describe("password recovery", () => {
  it.each([false, true])(
    "login links to the correctly scoped recovery screen (admin=%s)",
    async (admin) => {
      reply("GET", { "/auth/providers": ok({ google: true, email: true }) });
      view(<Login account={null} onAccount={vi.fn()} admin={admin} />);
      expect(
        screen
          .getByRole("link", { name: "Forgot password?" })
          .getAttribute("href"),
      ).toBe(
        admin ? adminConsolePath + "/forgot-password" : "/forgot-password",
      );
    },
  );
  it("submits the email without confirming account existence and supports Google-only users", async () => {
    reply("GET", { "/auth/password-recovery/challenge": ok({}) });
    const post = reply("POST", {
      "/auth/password-recovery/request": ok(challenge),
    });
    view(<ForgotPassword />);
    await screen.findByRole("button", { name: "Send recovery instructions" });
    expect(screen.getByText(/first joined with Google/)).toBeTruthy();
    change("Email address", "new@example.test");
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Send recovery instructions" })
        .closest("form")!,
    );
    await screen.findByLabelText("Verification code");
    expect(post).toHaveBeenCalledWith("/auth/password-recovery/request", {
      body: { email: "new@example.test", admin: false },
    });
    expect(screen.getByText(/If this email is eligible/)).toBeTruthy();
  });
  it.each([false, true])(
    "resumes and verifies a recovery code then navigates to set password (admin=%s)",
    async (admin) => {
      reply("GET", {
        "/auth/password-recovery/challenge": ok({ challenge, admin }),
      });
      const post = reply("POST", {
        "/auth/password-recovery/verify": ok({ ...grant, admin }),
      });
      view(<ForgotPassword admin={admin} />);
      await screen.findByLabelText("Verification code");
      change("Verification code", "123456");
      fireEvent.click(
        screen.getByRole("button", { name: "Verify recovery code" }),
      );
      await waitFor(() =>
        expect(screen.getByRole("note").textContent).toBe(
          admin ? adminConsolePath + "/reset-password" : "/reset-password",
        ),
      );
      expect(post).toHaveBeenCalledWith("/auth/password-recovery/verify", {
        body: { code: "123456" },
      });
    },
  );
  it("ignores recovery from another scope and submits a separate admin request", async () => {
    reply("GET", {
      "/auth/password-recovery/challenge": ok({ challenge, admin: false }),
    });
    const post = reply("POST", {
      "/auth/password-recovery/request": ok(challenge),
    });
    view(<ForgotPassword admin />);
    await screen.findByRole("button", { name: "Send recovery instructions" });
    change("Email address", "admin@example.test");
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Send recovery instructions" })
        .closest("form")!,
    );
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/auth/password-recovery/request", {
        body: { email: "admin@example.test", admin: true },
      }),
    );
  });
  it("keeps code entry available for correction after a verification error and supports resend", async () => {
    reply("GET", {
      "/auth/password-recovery/challenge": ok({ challenge, admin: false }),
    });
    reply("POST", {
      "/auth/password-recovery/verify": fail(
        401,
        "The code is incorrect or expired.",
      ),
      "/auth/resend": ok(challenge),
    });
    view(<ForgotPassword />);
    await screen.findByLabelText("Verification code");
    change("Verification code", "111111");
    fireEvent.click(
      screen.getByRole("button", { name: "Verify recovery code" }),
    );
    await screen.findByText("The code is incorrect or expired.");
    expect(screen.getByRole("note").textContent).toBe("/");
    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    await screen.findByText("A new code has been sent.");
    expect(
      (screen.getByLabelText("Verification code") as HTMLInputElement).value,
    ).toBe("");
  });
  it("shows request errors and lets the user retry or start over", async () => {
    reply("GET", { "/auth/password-recovery/challenge": ok({}) });
    reply("POST", {
      "/auth/password-recovery/request": fail(
        429,
        "Too many code requests. Please try again later.",
      ),
    });
    view(<ForgotPassword />);
    await screen.findByRole("button", { name: "Send recovery instructions" });
    change("Email address", "person@example.test");
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Send recovery instructions" })
        .closest("form")!,
    );
    await screen.findByRole("alert");
    reply("POST", { "/auth/password-recovery/request": ok(challenge) });
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Send recovery instructions" })
        .closest("form")!,
    );
    await screen.findByLabelText("Verification code");
    fireEvent.click(
      screen.getByRole("button", { name: "Start a new request" }),
    );
    expect(screen.getByLabelText("Email address")).toBeTruthy();
  });
  it("requires matching passwords and provides visibility controls", async () => {
    reply("GET", { "/auth/password-recovery/grant": ok(grant) });
    view(<ResetPassword onSignOut={vi.fn()} />);
    await screen.findByLabelText("New password");
    change("New password", "A strong new password");
    change("Confirm new password", "Another strong password");
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Save new password" })
        .closest("form")!,
    );
    await screen.findByText("Your new passwords do not match.");
    expect(api.POST).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Show new password" }));
    expect(
      (screen.getByLabelText("New password") as HTMLInputElement).type,
    ).toBe("text");
    fireEvent.click(
      screen.getByRole("button", { name: "Show confirm new password" }),
    );
    expect(
      (screen.getByLabelText("Confirm new password") as HTMLInputElement).type,
    ).toBe("text");
  });
  it.each([false, true])(
    "saves a password, clears signed-in state, and requires sign-in again (admin=%s)",
    async (admin) => {
      reply("GET", {
        "/auth/password-recovery/grant": ok({ ...grant, admin }),
      });
      const post = reply("POST", {
          "/auth/password-recovery/complete": ok(true),
        }),
        onSignOut = vi.fn();
      view(<ResetPassword admin={admin} onSignOut={onSignOut} />);
      await screen.findByLabelText("New password");
      change("New password", "A strong new password");
      change("Confirm new password", "A strong new password");
      fireEvent.submit(
        screen
          .getByRole("button", { name: "Save new password" })
          .closest("form")!,
      );
      await screen.findByRole("heading", { name: "Password updated." });
      expect(onSignOut).toHaveBeenCalledOnce();
      expect(post).toHaveBeenCalledWith("/auth/password-recovery/complete", {
        body: {
          newPassword: "A strong new password",
          confirmPassword: "A strong new password",
        },
      });
      expect(
        screen
          .getByRole("link", { name: "Sign in with your new password" })
          .getAttribute("href"),
      ).toBe(admin ? adminConsolePath : "/login");
    },
  );
  it("handles an expired grant without rendering password inputs", async () => {
    reply("GET", {
      "/auth/password-recovery/grant": ok({
        ...grant,
        expiresAt: "2000-01-01T00:00:00Z",
      }),
    });
    view(<ResetPassword onSignOut={vi.fn()} />);
    await screen.findByText(/Your recovery session has expired/);
    expect(screen.queryByLabelText("New password")).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Request a new code" })
        .getAttribute("href"),
    ).toBe("/forgot-password");
  });
  it("handles a missing or reused grant and an incorrect host scope", async () => {
    reply("GET", {
      "/auth/password-recovery/grant": fail(
        401,
        "Your password recovery has expired or changed. Request a new code.",
      ),
    });
    const first = view(<ResetPassword onSignOut={vi.fn()} />);
    await screen.findByRole("alert");
    expect(screen.queryByLabelText("New password")).toBeNull();
    first.unmount();
    reply("GET", {
      "/auth/password-recovery/grant": ok({ ...grant, admin: true }),
    });
    view(<ResetPassword onSignOut={vi.fn()} />);
    await screen.findByText(/correct sign-in page/);
    expect(screen.queryByLabelText("New password")).toBeNull();
  });
  it("preserves the form and signed-in state when saving fails", async () => {
    reply("GET", { "/auth/password-recovery/grant": ok(grant) });
    reply("POST", {
      "/auth/password-recovery/complete": fail(
        401,
        "Your password recovery has expired or changed. Request a new code.",
      ),
    });
    const onSignOut = vi.fn();
    view(<ResetPassword onSignOut={onSignOut} />);
    await screen.findByLabelText("New password");
    change("New password", "A strong new password");
    change("Confirm new password", "A strong new password");
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Save new password" })
        .closest("form")!,
    );
    await screen.findByRole("alert");
    expect(onSignOut).not.toHaveBeenCalled();
  });
  it("registers real recovery screens and keeps admin recovery off the patient and public hosts", async () => {
    for (const path of ["/forgot-password", "/reset-password"]) {
      expect(isAppRoute(path, "dashboard")).toBe(true);
      expect(isAppRoute(path, "public")).toBe(false);
      expect(isAppRoute(path, "admin")).toBe(false);
    }
    for (const path of ["/forgot-password", "/reset-password"]) {
      expect(isAppRoute(adminConsolePath + path, "admin")).toBe(true);
      expect(isAppRoute(adminConsolePath + path, "dashboard")).toBe(false);
    }
    expect(isAppRoute("/", "admin")).toBe(false);
    reply("GET", {
      "/auth/me": fail(401, "Sign in"),
      "/auth/password-recovery/challenge": ok({}),
    });
    view(<App />, "/forgot-password");
    await screen.findByRole("heading", { name: "Forgot your password?" });
  });
});
