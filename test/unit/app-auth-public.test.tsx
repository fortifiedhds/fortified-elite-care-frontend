import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";
import { AccountHelp } from "../../src/features/auth/AccountHelp";
import { Login } from "../../src/features/auth/Login";
import { Register } from "../../src/features/auth/Register";
import { PublicHome } from "../../src/features/public/PublicHome";
import { PublicPage } from "../../src/features/public/PublicPage";
import { api, messageFor, readResponse } from "../../src/shared/api/client";
import { dateLabel } from "../../src/shared/lib/dates";
import {
  dashboard,
  doctor,
  fail,
  ok,
  patient,
  pending,
  reply,
  today,
  view,
} from "../fixtures";

describe("app entry and public navigation", () => {
  it("checks the session before redirecting an unauthenticated private route", async () => {
    let resolve: (result: ReturnType<typeof fail>) => void = () => {};
    reply("GET", {
      "/auth/me": () =>
        new Promise((done) => {
          resolve = done;
        }),
    });
    view(<App />, "/portal");
    expect(screen.getByRole("status").textContent).toMatch(
      /Checking your session/,
    );
    resolve(fail(401, "Sign in to continue."));
    await screen.findByRole("heading", { name: "Sign in to your portal." });
    expect(screen.getByLabelText("Current route").textContent).toBe("/login");
  });

  it("opens the role workspace for an authenticated session", async () => {
    reply("GET", { "/auth/me": ok(patient), "/dashboard": ok(dashboard()) });
    view(<App />, "/portal");
    await screen.findByRole("heading", { name: "Welcome, Test Patient" });
    expect(
      within(
        screen
          .getByRole("heading", { name: "Care permissions" })
          .closest("article")!,
      )
        .getByRole("link", { name: "Open form" })
        .getAttribute("href"),
    ).toBe("/portal/consent");
  });

  it("handles unknown routes with a link back to the homepage", () => {
    reply("GET", { "/auth/me": ok(null) });
    view(<App />, "/missing");
    expect(
      screen.getByRole("heading", { name: "Page unavailable" }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Go to Fortified Elite Care" })
        .getAttribute("href"),
    ).toBe("/");
  });

  it("toggles mobile navigation and switches the account link when signed in", async () => {
    const user = userEvent.setup();
    view(<PublicHome signedIn />, "/");
    const menu = screen.getByRole("button", { name: "Open navigation" });
    await user.click(menu);
    expect(menu.getAttribute("aria-expanded")).toBe("true");
    expect(
      screen.getByRole("link", { name: "My portal" }).getAttribute("href"),
    ).toBe("/portal");
    await user.click(screen.getByRole("button", { name: "Close navigation" }));
    expect(menu.getAttribute("aria-expanded")).toBe("false");
    expect(
      screen
        .getAllByRole("link", { name: "Start patient enrolment" })[0]
        .getAttribute("href"),
    ).toBe("/register?role=patient");
    const question = screen.getByText("Who is Fortified Elite Care for?");
    await user.click(question);
    expect(question.closest("details")?.open).toBe(true);
  });

  it.each([
    ["about", /Dignity and independence/],
    ["how-it-works", /From your first form/],
    ["services", /Care that meets you/],
    ["for-families", /A familiar place/],
    ["for-doctors", /Bring good care closer/],
    ["faq", /Frequently asked questions/],
    ["contact", /How can we help/],
    ["privacy", /Privacy and confidentiality/],
    ["terms", /Terms and service agreement/],
  ] as const)(
    "renders the %s public route with its page heading",
    (page, heading) => {
      view(<PublicPage page={page} signedIn={false} />, "/" + page);
      expect(
        screen.getByRole("heading", { level: 1, name: heading }),
      ).toBeTruthy();
    },
  );
});

describe("sign-in and enrolment", () => {
  it("submits credentials and passes the returned account to the app", async () => {
    const onAccount = vi.fn();
    const post = reply("POST", { "/auth/login": ok(patient, 201) });
    view(<Login account={null} onAccount={onAccount} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email address"), patient.email);
    await user.type(screen.getByLabelText("Password"), "synthetic passphrase");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(post).toHaveBeenCalledWith("/auth/login", {
      body: { email: patient.email, password: "synthetic passphrase" },
    });
    expect(onAccount).toHaveBeenCalledWith(patient);
  });

  it("shows a rejected login and leaves the form available for retry", async () => {
    reply("POST", {
      "/auth/login": fail(401, "Email or password is incorrect."),
    });
    view(<Login account={null} onAccount={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: patient.email },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "synthetic passphrase" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Sign in" }).closest("form")!,
    );
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Email or password is incorrect.",
    );
    expect(
      (screen.getByRole("button", { name: "Sign in" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it("links account help to the care team and back to sign-in", () => {
    view(<AccountHelp />);
    expect(
      screen
        .getByRole("link", { name: "Contact the care team" })
        .getAttribute("href"),
    ).toBe("/contact");
    expect(
      screen
        .getByRole("link", { name: "Back to sign in" })
        .getAttribute("href"),
    ).toBe("/login");
  });

  it("collects the patient's explicit choices before submitting and opens their registration draft", async () => {
    const account = pending(patient);
    reply("GET", {
      "/auth/me": fail(401, "Sign in to continue."),
      "/dashboard": ok(dashboard(account)),
      "/forms/{kind}/definition": ok({
        version: "registration-v1",
        sections: [{ title: "About you", fields: [] }],
      }),
      "/patients/forms/{kind}": ok({
        version: "registration-v1",
        revision: 0,
        answers: {},
      }),
    });
    const post = reply("POST", {
      "/auth/register/patient": ok(account, 201),
    });
    view(<App />, "/register?role=patient");
    for (const [label, value] of [
      ["Full name", patient.name],
      ["Email address", patient.email],
      ["Password", "synthetic passphrase"],
      ["Area where you live", "Central"],
      ["Preferred visit date", today],
      [/Sponsor name/, "Test sponsor"],
    ] as const)
      fireEvent.change(
        screen.getByLabelText(
          typeof label === "string" ? new RegExp("^" + label) : label,
        ),
        { target: { value } },
      );
    fireEvent.click(
      screen.getByRole("button", { name: /Continue to care permissions/ }),
    );
    expect(post).not.toHaveBeenCalled();
    const groups = screen.getAllByRole("group");
    expect(groups).toHaveLength(6);
    for (const [i, group] of groups.entries())
      fireEvent.click(
        within(group).getByRole("radio", { name: i === 2 ? "No" : "Yes" }),
      );
    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));
    expect(post).toHaveBeenCalledWith("/auth/register/patient", {
      body: expect.objectContaining({
        preferredDate: today,
        sponsorName: "Test sponsor",
        healthAssessment: true,
        homeVisits: true,
        sampleCollection: false,
        education: true,
        referrals: true,
        emergencyContact: true,
      }),
    });
    await waitFor(() =>
      expect(screen.getByLabelText("Current route").textContent).toBe(
        "/portal/registration",
      ),
    );
    expect(
      await screen.findByRole("heading", { name: "About you" }),
    ).toBeTruthy();
  });

  it("sends doctor credentials to the doctor endpoint without patient fields", async () => {
    const onAccount = vi.fn(),
      user = userEvent.setup();
    const post = reply("POST", {
      "/auth/register/doctor": ok(pending(doctor), 201),
    });
    view(
      <Register account={null} onAccount={onAccount} />,
      "/register?role=doctor",
    );
    for (const [label, value] of [
      ["Full name", doctor.name],
      ["Email address", doctor.email],
      ["Password", "synthetic passphrase"],
      ["Area you cover for home visits", "Central"],
      ["Professional registration or licence number", "MDCN123"],
    ])
      fireEvent.change(
        screen.getByLabelText(
          typeof label === "string" ? new RegExp("^" + label) : label,
        ),
        { target: { value } },
      );
    await user.click(
      screen.getByRole("button", { name: "Submit application" }),
    );
    expect(post).toHaveBeenCalledWith("/auth/register/doctor", {
      body: {
        name: doctor.name,
        email: doctor.email,
        password: "synthetic passphrase",
        area: "Central",
        credentialId: "MDCN123",
      },
    });
    expect(onAccount).toHaveBeenCalledWith(pending(doctor));
  });
});

describe("shared date and API formatting", () => {
  it("returns false/empty API data and formats validation and transport errors", () => {
    expect(readResponse(ok(false))).toBe(false);
    expect(readResponse(ok([]))).toEqual([]);
    expect(() =>
      readResponse(fail(400, ["Date required", "Invalid area"])),
    ).toThrow("Date required. Invalid area");
    expect(() =>
      readResponse({ response: new Response(null, { status: 500 }) }),
    ).toThrow(/could not complete/);
    expect(messageFor(new TypeError("Failed to fetch"))).toMatch(/unavailable/);
    expect(messageFor(new Error("Test"))).toBe("Test");
    expect(messageFor(null)).toBe("Something went wrong. Please try again.");
  });

  it("displays calendar dates without shifting the day", () => {
    expect(dateLabel("2026-01-01")).toMatch(/1 Jan 2026/);
    expect(api).toBeDefined();
  });
});
