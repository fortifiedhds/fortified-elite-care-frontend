import { fireEvent, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { createSecureFetch } from "../../src/shared/api/security-fetch";
import { readResponse, UserFacingError } from "../../src/shared/api/client";
import { Login } from "../../src/features/auth/Login";
import { ok, reply, view } from "../fixtures";
const base = "https://api.example.test/api/v1",
  bootstrapId = "d94f64b2-8b77-4b79-9bf2-d662ca59287f",
  failedId = "23484887-f247-43de-a4d5-71a1e07fb89e";
it("links each mutation to its bootstrap request ID without retrying a rejected mutation", async () => {
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ token: "synthetic-proof" }), {
        headers: { "X-Request-ID": bootstrapId },
      }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ code: "CSRF_INVALID" }), {
        status: 403,
        headers: { "X-Request-ID": failedId },
      }),
    );
  const response = await createSecureFetch(base)(
    new Request(base + "/auth/login", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        email: "synthetic@example.test",
        password: "synthetic-password",
      }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(fetch).toHaveBeenCalledTimes(2);
  const sent = fetch.mock.calls[1][0] as Request;
  expect(sent.headers.get("X-CSRF-Bootstrap-ID")).toBe(bootstrapId);
  expect(sent.headers.get("X-CSRF-Token")).toBe("synthetic-proof");
  expect(await sent.json()).toEqual({
    email: "synthetic@example.test",
    password: "synthetic-password",
  });
  expect(response.status).toBe(403);
});
it("does not forward malformed bootstrap IDs or stale caller-provided trace headers", async () => {
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ token: "synthetic-proof" }), {
        headers: { "X-Request-ID": "private-untrusted-string" },
      }),
    )
    .mockResolvedValueOnce(new Response("true"));
  await createSecureFetch(base)(base + "/auth/logout", {
    method: "POST",
    headers: { "X-CSRF-Bootstrap-ID": bootstrapId },
  });
  expect(
    new Headers(fetch.mock.calls[1][1]?.headers).has("X-CSRF-Bootstrap-ID"),
  ).toBe(false);
});
it("CSRF errors retain a validated support reference separately from the user message", () => {
  try {
    readResponse({
      error: {
        code: "CSRF_INVALID",
        message: "private-cookie-secret",
        reason: "COOKIE_MISSING",
      },
      response: new Response(null, {
        status: 403,
        headers: { "X-Request-ID": failedId },
      }),
    });
    throw Error("Expected a user-facing error");
  } catch (error) {
    expect(error).toBeInstanceOf(UserFacingError);
    expect((error as UserFacingError).code).toBe("CSRF_INVALID");
    expect((error as UserFacingError).supportReference).toBe(failedId);
    expect((error as Error).message).toBe(
      "We couldn’t complete this step on your device. Please contact our care team for help.",
    );
    expect((error as Error).message).not.toMatch(
      /private|COOKIE_MISSING|CSRF|security check|Support reference|23484887/,
    );
  }
  try {
    readResponse({
      error: { code: "CSRF_INVALID", message: "private-cookie-secret" },
      response: new Response(null, {
        status: 403,
        headers: { "X-Request-ID": "private-untrusted-header" },
      }),
    });
  } catch (error) {
    expect(error).toBeInstanceOf(UserFacingError);
    expect((error as UserFacingError).supportReference).toBeUndefined();
    expect((error as Error).message).not.toMatch(/private|Support reference/);
  }
});
it.each([false, true])(
  "login offers help and hides the reference until support details are expanded (admin=%s)",
  async (admin) => {
    reply("GET", { "/auth/providers": ok({ google: true, email: true }) });
    reply("POST", {
      [admin ? "/auth/admin/login" : "/auth/login"]: {
        error: {
          code: "CSRF_INVALID",
          message: "Your security check needs to be refreshed.",
        },
        response: new Response(null, {
          status: 403,
          headers: { "X-Request-ID": failedId },
        }),
      },
    });
    view(<Login account={null} onAccount={vi.fn()} admin={admin} />);
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "synthetic@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Synthetic password 2026" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Sign in" }).closest("form")!,
    );
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe(
      "We’re having trouble signing you in on this device.",
    );
    expect(alert.textContent).not.toMatch(
      /security check|Support reference|23484887/,
    );
    expect(
      screen
        .getByRole("link", { name: "Get help signing in" })
        .getAttribute("href"),
    ).toBe("/contact");
    const reference = screen.getByText(failedId),
      details = reference.closest("details")!;
    expect(details.hasAttribute("open")).toBe(false);
    fireEvent.click(screen.getByText("Details for support"));
    expect(details.hasAttribute("open")).toBe(true);
  },
);
it("a blocked sign-in still offers help if no valid support reference is available", async () => {
  reply("GET", { "/auth/providers": ok({ google: true, email: true }) });
  reply("POST", {
    "/auth/login": {
      error: { code: "CSRF_INVALID" },
      response: new Response(null, { status: 403 }),
    },
  });
  view(<Login account={null} onAccount={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "synthetic@example.test" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "Synthetic password 2026" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Sign in" }).closest("form")!,
  );
  await screen.findByRole("alert");
  expect(
    screen.getByRole("link", { name: "Get help signing in" }),
  ).toBeTruthy();
  expect(screen.queryByText("Details for support")).toBeNull();
});
it("a new sign-in clears previous support details and preserves ordinary credential error wording", async () => {
  reply("GET", { "/auth/providers": ok({ google: true, email: true }) });
  let attempts = 0;
  reply("POST", {
    "/auth/login": () =>
      ++attempts === 1
        ? {
            error: { code: "CSRF_INVALID" },
            response: new Response(null, {
              status: 403,
              headers: { "X-Request-ID": failedId },
            }),
          }
        : {
            error: { message: "Email or password is incorrect." },
            response: new Response(null, { status: 401 }),
          },
  });
  view(<Login account={null} onAccount={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "synthetic@example.test" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "Synthetic password 2026" },
  });
  const form = screen.getByRole("button", { name: "Sign in" }).closest("form")!;
  fireEvent.submit(form);
  await screen.findByText("Details for support");
  fireEvent.submit(form);
  await screen.findByText("Email or password is incorrect.");
  expect(screen.queryByText("Details for support")).toBeNull();
  expect(
    screen.queryByRole("link", { name: "Get help signing in" }),
  ).toBeNull();
});
