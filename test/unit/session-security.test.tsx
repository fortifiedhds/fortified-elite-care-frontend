import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState as ReactUseState } from "react";
import { createSecureFetch } from "../../src/shared/api/security-fetch";
import {
  sessionState,
  readSessionHeaders,
} from "../../src/shared/api/session-state";
import { SessionSecurity } from "../../src/features/session-security/SessionSecurity";
import {
  DraftIdentity,
  clearMemoryDrafts,
  useMemoryDraft,
} from "../../src/features/session-security/draft-memory";
import { Settings } from "../../src/features/settings/Settings";
import { DraftWizard } from "../../src/features/care-forms/components/DraftWizard";
import { NoteForm } from "../../src/features/portal/doctor/NoteForm";
import { App } from "../../src/app/App";
import { authReturnPath } from "../../src/shared/lib/auth-return";
import { adminConsolePath } from "../../src/shared/lib/routes";
import {
  doctor,
  admin,
  dashboard,
  fail,
  visit,
  ok,
  reply,
  view,
  signupChallenge,
} from "../fixtures";
const base = "https://api.example.test/api/v1";
afterEach(() => {
  vi.useRealTimers();
  sessionState.set(null);
  clearMemoryDrafts();
});
describe("CSRF transport and session state", () => {
  it("bootstraps CSRF for mutations and includes proof without exposing cookie values", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: "csrf-proof" })),
      )
      .mockResolvedValueOnce(new Response("true"));
    await createSecureFetch(base)(base + "/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    expect(fetch.mock.calls[0][0]).toBe(base + "/auth/csrf");
    expect(fetch.mock.calls[0][1]?.credentials).toBe("include");
    expect(
      new Headers(fetch.mock.calls[1][1]?.headers).get("X-CSRF-Token"),
    ).toBe("csrf-proof");
  });
  it("handles openapi Request objects, preserves JSON and fetches fresh proof for each mutation", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) =>
        String(input).endsWith("/auth/csrf")
          ? new Response(JSON.stringify({ token: "proof" }))
          : new Response("true"),
      );
    const send = createSecureFetch(base);
    await send(
      new Request(base + "/patients/preference", {
        method: "PATCH",
        body: JSON.stringify({ dayOfMonth: 15 }),
        headers: { "content-type": "application/json" },
        credentials: "include",
      }),
    );
    const request = fetch.mock.calls[1][0] as Request;
    expect(request.headers.get("X-CSRF-Token")).toBe("proof");
    expect(await request.json()).toEqual({ dayOfMonth: 15 });
    await send(base + "/auth/logout", { method: "POST" });
    expect(fetch).toHaveBeenCalledTimes(4);
  });
  it("does not submit the mutation when the CSRF bootstrap fails", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("unavailable", { status: 503 }));
    expect(
      (await createSecureFetch(base)(base + "/auth/logout", { method: "POST" }))
        .status,
    ).toBe(503);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("reads server deadlines and expires only on session-specific 401 responses", async () => {
    const send = createSecureFetch(base);
    const times = { absolute: Date.now() + 3600000, idle: Date.now() + 900000 };
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response("{}", {
          headers: {
            "X-Session-Expires-At": new Date(times.absolute).toISOString(),
            "X-Session-Idle-Expires-At": new Date(times.idle).toISOString(),
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Incorrect OTP" }), {
          status: 401,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ code: "SESSION_EXPIRED" }), {
          status: 401,
        }),
      );
    await send(base + "/auth/me");
    expect(sessionState.get()).toEqual(times);
    await send(base + "/auth/challenge");
    expect(sessionState.get()).toEqual(times);
    await send(base + "/auth/me");
    expect(sessionState.get()).toEqual({ absolute: 0, idle: 0 });
  });
});
describe("expiry experience", () => {
  it("clears visible edits when the account changes without unmounting the editor", () => {
    function Editor() {
      const [value, set] = useMemoryDraft("", 1, "identity");
      return (
        <label>
          Private draft
          <input value={value} onChange={(e) => set(e.target.value)} />
        </label>
      );
    }
    function Wrapper() {
      const [identity, setIdentity] = ReactUseState("one");
      return (
        <DraftIdentity.Provider value={identity}>
          <Editor />
          <button onClick={() => setIdentity("two")}>Switch account</button>
        </DraftIdentity.Provider>
      );
    }
    view(<Wrapper />, "/portal/registration");
    fireEvent.change(screen.getByLabelText("Private draft"), {
      target: { value: "Private to first user" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Switch account" }));
    expect(
      (screen.getByLabelText("Private draft") as HTMLInputElement).value,
    ).toBe("");
  });
  it("expires recovery data after thirty minutes and rejects a changed server revision", () => {
    vi.useFakeTimers();
    function Editor({ revision = 1 }: { revision?: number }) {
      const [value, set] = useMemoryDraft("", revision, "expiry");
      return (
        <label>
          Recovered draft
          <input value={value} onChange={(e) => set(e.target.value)} />
        </label>
      );
    }
    const first = view(
      <DraftIdentity.Provider value="one">
        <Editor />
      </DraftIdentity.Provider>,
      "/portal/registration",
    );
    fireEvent.change(screen.getByLabelText("Recovered draft"), {
      target: { value: "Private" },
    });
    first.unmount();
    const changed = view(
      <DraftIdentity.Provider value="one">
        <Editor revision={2} />
      </DraftIdentity.Provider>,
      "/portal/registration",
    );
    expect(
      (screen.getByLabelText("Recovered draft") as HTMLInputElement).value,
    ).toBe("");
    fireEvent.change(screen.getByLabelText("Recovered draft"), {
      target: { value: "New revision draft" },
    });
    changed.unmount();
    act(() => vi.advanceTimersByTime(30 * 60_000 + 1));
    view(
      <DraftIdentity.Provider value="one">
        <Editor revision={2} />
      </DraftIdentity.Provider>,
      "/portal/registration",
    );
    expect(
      (screen.getByLabelText("Recovered draft") as HTMLInputElement).value,
    ).toBe("");
  });
  it("warns before inactivity expiry, requests a draft save and lets the user continue", async () => {
    const onExpired = vi.fn(),
      save = vi.fn();
    window.addEventListener("fec:session-warning", save);
    const now = Date.now();
    sessionState.set({ absolute: now + 3600000, idle: now + 90000 });
    reply("POST", {
      "/auth/session/continue": () => {
        sessionState.set({
          absolute: now + 3600000,
          idle: Date.now() + 900000,
        });
        return ok(true);
      },
    });
    render(<SessionSecurity onExpired={onExpired} />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(save).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Stay signed in" }));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(onExpired).not.toHaveBeenCalled();
    window.removeEventListener("fec:session-warning", save);
  });
  it("absolute expiry cannot be extended and expiration signs out", () => {
    vi.useFakeTimers();
    const now = Date.now(),
      onExpired = vi.fn();
    sessionState.set({ absolute: now + 3000, idle: now + 900000 });
    render(<SessionSecurity onExpired={onExpired} />);
    expect(screen.queryByRole("button", { name: "Stay signed in" })).toBeNull();
    act(() => vi.advanceTimersByTime(4000));
    expect(onExpired).toHaveBeenCalled();
  });
  it("restores same-account drafts in memory and isolates another user", () => {
    function Editor() {
      const [value, set] = useMemoryDraft("", 1, "test");
      return (
        <label>
          Draft
          <input value={value} onChange={(e) => set(e.target.value)} />
        </label>
      );
    }
    const first = view(
      <DraftIdentity.Provider value={doctor.id}>
        <Editor />
      </DraftIdentity.Provider>,
      "/portal/registration",
    );
    fireEvent.change(screen.getByLabelText("Draft"), {
      target: { value: "Unsaved private draft" },
    });
    first.unmount();
    const second = view(
      <DraftIdentity.Provider value={doctor.id}>
        <Editor />
      </DraftIdentity.Provider>,
      "/portal/registration",
    );
    expect((screen.getByLabelText("Draft") as HTMLInputElement).value).toBe(
      "Unsaved private draft",
    );
    second.unmount();
    view(
      <DraftIdentity.Provider value="another-user">
        <Editor />
      </DraftIdentity.Provider>,
      "/portal/registration",
    );
    expect((screen.getByLabelText("Draft") as HTMLInputElement).value).toBe("");
  });
  it("expiry warning saves an editable draft without submitting or signing it", async () => {
    const onSave = vi.fn(async (body) => ({ ...body, revision: 1 }));
    view(
      <DraftWizard
        definition={{
          version: "v1",
          sections: [
            {
              title: "Details",
              description: "Draft",
              fields: [{ id: "name", label: "Name", type: "text" }],
            },
          ],
        }}
        initial={{ version: "v1", revision: 0, answers: {} }}
        onSave={onSave}
        exit="/portal"
        description="Draft"
        submitLabel="Submit"
      />,
    );
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Synthetic draft" },
    });
    act(() => window.dispatchEvent(new Event("fec:session-warning")));
    await screen.findByText("Draft saved.");
    expect(onSave).toHaveBeenCalledWith({
      version: "v1",
      revision: 0,
      answers: { name: "Synthetic draft" },
      submit: false,
    });
  });
  it("confirms sign-out-all with email OTP before leaving the portal", async () => {
    reply("GET", {
      "/auth/security": ok({
        hasPassword: true,
        googleLinked: false,
        emailVerified: true,
      }),
    });
    const post = reply("POST", {
      "/auth/sessions/revoke": ok({
        ...signupChallenge,
        purpose: "SESSION_REVOKE",
      }),
      "/auth/sessions/revoke/confirm": ok(true),
    });
    const onSignOut = vi.fn();
    view(<Settings onSignOut={onSignOut} />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Sign out all devices" }),
    );
    expect(onSignOut).not.toHaveBeenCalled();
    fireEvent.change(await screen.findByLabelText("Verification code"), {
      target: { value: "123456" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Sign out all devices" }),
    );
    await waitFor(() => expect(onSignOut).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith("/auth/sessions/revoke/confirm", {
      body: { code: "123456" },
    });
  });
  it("only accepts known local return paths for admin review links", () => {
    const path = adminConsolePath + "/enrolments/doctor/credentials";
    expect(authReturnPath(path, true)).toBe(path);
    for (const invalid of [
      "https://evil.example",
      "//evil.example",
      adminConsolePath + "/unknown",
      "/portal",
      path + "?redirect=evil",
    ])
      expect(authReturnPath(invalid, true)).toBeUndefined();
  });
  it("preserves an admin email deep link through password and OTP sign-in", async () => {
    reply("GET", {
      "/auth/me": fail(401, "Sign in to continue."),
      "/auth/challenge": ok({ ...signupChallenge, purpose: "ADMIN_LOGIN" }),
      "/dashboard": ok(dashboard(admin)),
      "/admin/doctors/{id}/credentials": ok({
        doctorId: "doctor",
        name: doctor.name,
        credentialId: "MDCN123",
        reviewStatus: "PENDING",
        revision: 0,
        submittedAt: null,
        certificates: [],
      }),
    });
    reply("POST", {
      "/auth/admin/login": ok({
        challenge: { ...signupChallenge, purpose: "ADMIN_LOGIN" },
      }),
      "/auth/verify": ok({ account: admin }),
    });
    const path = adminConsolePath + "/enrolments/doctor/credentials";
    view(<App />, path);
    fireEvent.change(await screen.findByLabelText("Email address"), {
      target: { value: admin.email },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "synthetic password" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Sign in" }).closest("form")!,
    );
    fireEvent.change(await screen.findByLabelText("Verification code"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify code" }));
    await screen.findByRole("heading", { name: "Doctor application review" });
    expect(
      screen.getByRole("note", { name: "Current route" }).textContent,
    ).toBe(path);
  });
  it("expiry draft saving never signs or completes a consultation note", async () => {
    reply("GET", {
      "/forms/{kind}/definition": ok({ version: "v1", sections: [] }),
    });
    const patch = reply("PATCH", { "/visits/{id}/note": ok(true) });
    const act = vi.fn(async (request: () => Promise<unknown>) => {
      await request();
      return true;
    });
    view(
      <DraftIdentity.Provider value={doctor.id}>
        <NoteForm visit={visit} act={act} busy={false} />
      </DraftIdentity.Provider>,
      "/portal/assigned/visit-1",
    );
    fireEvent.change(screen.getByLabelText("Private observations"), {
      target: { value: "Synthetic draft observation" },
    });
    actReactWarning();
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(
        "/visits/{id}/note",
        expect.objectContaining({
          body: expect.objectContaining({
            observations: "Synthetic draft observation",
          }),
        }),
      ),
    );
  });
});
function actReactWarning() {
  act(() => window.dispatchEvent(new Event("fec:session-warning")));
}
