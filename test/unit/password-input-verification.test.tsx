import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import { PasswordInput } from "../../src/shared/ui/PasswordInput";
import { Login } from "../../src/features/auth/Login";
import { Register } from "../../src/features/auth/Register";
import { VerifyEmail } from "../../src/features/auth/VerifyEmail";
import { Settings } from "../../src/features/settings/Settings";
import { Administrators } from "../../src/features/portal/admin/Administrators";
import { api } from "../../src/shared/api/client";
import { fail, ok, reply, signupChallenge, view } from "../fixtures";

describe("password visibility", () => {
  it("starts masked and supports keyboard toggling without changing the value or submitting", async () => {
    const submitted = vi.fn();
    const user = userEvent.setup();
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted();
        }}
      >
        <label>
          Password
          <PasswordInput
            name="password"
            defaultValue="synthetic passphrase"
            autoComplete="current-password"
          />
        </label>
      </form>,
    );
    const input = screen.getByLabelText("Password") as HTMLInputElement;
    expect(input.type).toBe("password");
    expect(input.autocomplete).toBe("current-password");
    const reveal = screen.getByRole("button", { name: "Show password" });
    expect(reveal.getAttribute("aria-controls")).toBe(input.id);
    expect(reveal.getAttribute("aria-pressed")).toBe("false");
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(reveal);
    await user.keyboard(" ");
    expect(input.type).toBe("text");
    expect(input.value).toBe("synthetic passphrase");
    expect(
      screen
        .getByRole("button", { name: "Hide password" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    await user.keyboard("{Enter}");
    expect(input.type).toBe("password");
    expect(new FormData(input.form!).get("password")).toBe(
      "synthetic passphrase",
    );
    expect(submitted).not.toHaveBeenCalled();
  });

  it("keeps fields independent and disables visibility controls with their input", () => {
    render(
      <>
        <label>
          First
          <PasswordInput visibilityLabel="first password" />
        </label>
        <label>
          Second
          <PasswordInput visibilityLabel="second password" disabled />
        </label>
      </>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Show first password" }),
    );
    expect((screen.getByLabelText("First") as HTMLInputElement).type).toBe(
      "text",
    );
    expect((screen.getByLabelText("Second") as HTMLInputElement).type).toBe(
      "password",
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Show second password",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it.each([
    "login",
    "admin login",
    "patient registration",
    "doctor registration",
  ])("supports %s without issuing a submit request", async (flow) => {
    reply("GET", {
      "/auth/providers": ok({ google: true, email: true, uploads: false }),
    });
    if (flow.includes("registration"))
      view(
        <Register account={null} onAccount={vi.fn()} />,
        "/register?role=" + (flow.startsWith("patient") ? "patient" : "doctor"),
      );
    else
      view(
        <Login
          account={null}
          onAccount={vi.fn()}
          admin={flow === "admin login"}
        />,
      );
    const input = screen.getByLabelText(/^Password/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "synthetic passphrase" } });
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input.type).toBe("text");
    expect(input.value).toBe("synthetic passphrase");
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input.type).toBe("password");
    expect(api.POST).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "supports independent password settings fields when hasPassword=%s",
    async (hasPassword) => {
      reply("GET", {
        "/auth/security": ok({
          hasPassword,
          googleLinked: !hasPassword,
          emailVerified: true,
        }),
      });
      view(<Settings />);
      await screen.findByLabelText("New password");
      for (const [label, control] of [
        ...(hasPassword ? [["Current password", "current password"]] : []),
        ["New password", "new password"],
        ["Confirm new password", "confirm new password"],
      ]) {
        const input = screen.getByLabelText(label) as HTMLInputElement;
        fireEvent.change(input, { target: { value: "synthetic " + control } });
        fireEvent.click(
          screen.getByRole("button", { name: "Show " + control }),
        );
        expect(input.type).toBe("text");
        fireEvent.click(
          screen.getByRole("button", { name: "Hide " + control }),
        );
        expect(input.type).toBe("password");
        expect(input.value).toBe("synthetic " + control);
      }
      expect(api.POST).not.toHaveBeenCalled();
    },
  );

  it("reveals an initial administrator password without sending the administrator creation request", async () => {
    reply("GET", { "/admin/accounts": ok([]) });
    view(<Administrators refresh={vi.fn()} />);
    const input = (await screen.findByLabelText(
      "Initial password",
    )) as HTMLInputElement;
    fireEvent.change(input, {
      target: { value: "initial synthetic passphrase" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Show initial password" }),
    );
    expect(input.type).toBe("text");
    expect(input.value).toBe("initial synthetic passphrase");
    expect(api.POST).not.toHaveBeenCalled();
  });
});

describe("verification recovery", () => {
  it("can retry a failed challenge lookup and only shows the code field after the request is resumed", async () => {
    let requests = 0;
    reply("GET", {
      "/auth/challenge": () =>
        ++requests === 1
          ? fail(
              401,
              "We couldn’t resume your verification. Please start again in this browser.",
            )
          : ok(signupChallenge),
    });
    view(<VerifyEmail onAccount={vi.fn()} />, "/verify-email");
    await screen.findByText(/We couldn’t resume/);
    expect(screen.queryByLabelText("Verification code")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByLabelText("Verification code")).toBeTruthy();
    expect(requests).toBe(2);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("returns a signup with a missing verification session to the selected registration role", async () => {
    reply("GET", {
      "/auth/challenge": fail(
        401,
        "We couldn’t resume your verification. Please start again in this browser.",
      ),
    });
    reply("POST", {
      "/auth/register/doctor": ok({ challenge: signupChallenge }),
    });
    view(
      <Routes>
        <Route
          path="/register"
          element={<Register account={null} onAccount={vi.fn()} />}
        />
        <Route
          path="/verify-email"
          element={<VerifyEmail onAccount={vi.fn()} />}
        />
      </Routes>,
      "/register?role=doctor",
    );
    for (const [label, value] of [
      ["Full name", "Synthetic Doctor"],
      ["Email address", "doctor@example.test"],
      ["Password", "synthetic passphrase"],
      ["Area you cover for home visits", "Central"],
      ["Professional registration or licence number", "MDCN123"],
    ])
      fireEvent.change(screen.getByLabelText(new RegExp("^" + label)), {
        target: { value },
      });
    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));
    await screen.findByText(/We couldn’t resume/);
    expect(
      screen
        .getByRole("link", { name: "Restart registration" })
        .getAttribute("href"),
    ).toBe("/register?role=doctor");
    expect(
      screen
        .getByRole("link", { name: "Back to sign in" })
        .getAttribute("href"),
    ).toBe("/login");
    fireEvent.click(screen.getByRole("link", { name: "Restart registration" }));
    await waitFor(() =>
      expect(
        (screen.getByRole("radio", { name: "Doctor" }) as HTMLInputElement)
          .checked,
      ).toBe(true),
    );
  });
});
