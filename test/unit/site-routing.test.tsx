import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";
import { Login } from "../../src/features/auth/Login";
import { serveFrontend } from "../../src/hosting/cloudflare-worker";
import {
  adminConsolePath,
  adminVerificationPath,
  defaultOrigins,
  isAppRoute,
  publicPages,
  siteDestination,
  siteOrigins,
  surfaceForOrigin,
} from "../../src/shared/lib/routes";
import * as sites from "../../src/shared/lib/sites";
import { publicInfo } from "../../src/features/public/content";
import { navigation } from "../../src/features/portal/navigation";
import { fail, ok, reply, signupChallenge, view } from "../fixtures";

describe("domain origins and routes", () => {
  it("isolates the public, care and administrator hosts while combining local and preview screens", () => {
    expect(surfaceForOrigin(defaultOrigins.public, defaultOrigins)).toBe(
      "public",
    );
    expect(surfaceForOrigin(defaultOrigins.dashboard, defaultOrigins)).toBe(
      "dashboard",
    );
    expect(surfaceForOrigin(defaultOrigins.admin, defaultOrigins)).toBe(
      "admin",
    );
    expect(surfaceForOrigin("http://127.0.0.1:5173", defaultOrigins)).toBe(
      "combined",
    );
    expect(
      surfaceForOrigin("https://fec-test.vercel.app", defaultOrigins),
    ).toBe("combined");
    const shared = {
      public: "https://shared.example.org",
      dashboard: "https://shared.example.org",
      admin: "https://shared.example.org",
    };
    expect(surfaceForOrigin(shared.public, shared)).toBe("combined");
    expect(
      siteDestination(
        "dashboard",
        "/login",
        defaultOrigins.public,
        defaultOrigins,
      ),
    ).toBe(defaultOrigins.dashboard + "/login");
    expect(
      siteDestination("public", "/", defaultOrigins.admin, defaultOrigins),
    ).toBe(defaultOrigins.public + "/");
    expect(
      siteDestination(
        "admin",
        adminConsolePath,
        "http://127.0.0.1:5173",
        defaultOrigins,
      ),
    ).toBe(adminConsolePath);
  });

  it("validates explicit origin overrides and keeps its route inventory aligned with the screens", () => {
    expect(
      siteOrigins({ VITE_ADMIN_ORIGIN: "https://staff.example.org" }).admin,
    ).toBe("https://staff.example.org");
    expect(() =>
      siteOrigins({ VITE_ADMIN_ORIGIN: "https://staff.example.org/path" }),
    ).toThrow();
    expect(() =>
      siteOrigins({ VITE_PUBLIC_ORIGIN: "ftp://example.org" }),
    ).toThrow();
    expect([...publicPages].sort()).toEqual(Object.keys(publicInfo).sort());
    for (const page of publicPages)
      expect(isAppRoute("/" + page, "public")).toBe(true);
    for (const [role, tabs] of Object.entries(navigation)) {
      const base = role === "ADMIN" ? adminConsolePath : "/portal";
      for (const tab of tabs)
        expect(
          isAppRoute(
            base + (tab.path ? "/" + tab.path : ""),
            role === "ADMIN" ? "admin" : "dashboard",
          ),
        ).toBe(true);
    }
    expect(isAppRoute("/portal/assigned/visit-1/baseline", "dashboard")).toBe(
      true,
    );
    expect(
      isAppRoute(adminConsolePath + "/enrolments/patient-1/review", "admin"),
    ).toBe(true);
    expect(isAppRoute(adminVerificationPath, "admin")).toBe(true);
    for (const path of [
      "/",
      "/login",
      "/verify-email",
      "/about",
      "/portal",
      adminConsolePath + "/missing",
      adminConsolePath + "extra",
      "/missing",
    ])
      expect(isAppRoute(path, "admin")).toBe(false);
    expect(isAppRoute(adminConsolePath, "dashboard")).toBe(false);
    expect(isAppRoute("/portal/missing", "combined")).toBe(false);
  });

  it("shows the shared 404 page at the administrator root and keeps email verification inside the console", async () => {
    vi.spyOn(sites, "currentSurface").mockReturnValue("admin");
    reply("GET", {
      "/auth/me": fail(401, "Sign in."),
      "/auth/challenge": ok({ ...signupChallenge, purpose: "ADMIN_LOGIN" }),
    });
    const first = view(<App />, "/");
    expect(
      screen.getByRole("heading", { name: /Let’s get you.*back to care/ }),
    ).toBeTruthy();
    first.unmount();
    view(<App />, adminVerificationPath);
    expect(await screen.findByLabelText("Verification code")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Back to sign in" })
        .getAttribute("href"),
    ).toBe(adminConsolePath);
  });
});

describe("Cloudflare document responses", () => {
  it("returns real 404 statuses at the admin root and unknown routes while preserving valid deep links", async () => {
    const assets = {
      fetch: vi.fn(
        async () =>
          new Response("<html>app shell</html>", {
            headers: { "content-type": "text/html" },
          }),
      ),
    };
    for (const path of [
      "/",
      "/login",
      "/verify-email",
      adminConsolePath + "/missing",
      "/does-not-exist",
    ]) {
      const response = await serveFrontend(
        new Request(defaultOrigins.admin + path),
        assets,
        defaultOrigins,
      );
      expect(response.status).toBe(404);
      expect(await response.text()).toContain("app shell");
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
    for (const path of [
      adminConsolePath,
      adminVerificationPath,
      adminConsolePath + "/settings",
      adminConsolePath + "/administrators",
    ]) {
      expect(
        (
          await serveFrontend(
            new Request(defaultOrigins.admin + path),
            assets,
            defaultOrigins,
          )
        ).status,
      ).toBe(200);
    }
    expect(
      (
        await serveFrontend(
          new Request(
            defaultOrigins.dashboard + "/portal/assigned/visit.id/baseline",
          ),
          assets,
          defaultOrigins,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await serveFrontend(
          new Request(defaultOrigins.public + "/login"),
          assets,
          defaultOrigins,
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await serveFrontend(
          new Request(defaultOrigins.public + "/services"),
          assets,
          defaultOrigins,
        )
      ).status,
    ).toBe(200);
  });

  it("serves static assets, keeps missing assets as 404 and handles HEAD and unsupported methods", async () => {
    const assets = {
      fetch: vi.fn(
        async (request: Request) =>
          new Response(
            new URL(request.url).pathname === "/brand/google-g.png"
              ? "image bytes"
              : "missing",
            {
              status:
                new URL(request.url).pathname === "/missing.png" ? 404 : 200,
            },
          ),
      ),
    };
    const asset = await serveFrontend(
      new Request(defaultOrigins.admin + "/brand/google-g.png"),
      assets,
      defaultOrigins,
    );
    expect(await asset.text()).toBe("image bytes");
    expect(
      (
        await serveFrontend(
          new Request(defaultOrigins.admin + "/missing.png"),
          assets,
          defaultOrigins,
        )
      ).status,
    ).toBe(404);
    const head = await serveFrontend(
      new Request(defaultOrigins.admin, { method: "HEAD" }),
      assets,
      defaultOrigins,
    );
    expect(head.status).toBe(404);
    expect(await head.text()).toBe("");
    const post = await serveFrontend(
      new Request(defaultOrigins.admin, { method: "POST" }),
      assets,
      defaultOrigins,
    );
    expect(post.status).toBe(405);
    expect(post.headers.get("allow")).toBe("GET, HEAD");
  });
});

describe("Google provider refresh", () => {
  it("enables Google when the tab regains focus after provider configuration changes", async () => {
    let enabled = false;
    reply("GET", {
      "/auth/providers": () =>
        ok({ google: enabled, email: true, uploads: true }),
    });
    view(<Login account={null} onAccount={vi.fn()} />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: "Google sign-in is being configured",
        }),
      ).toBeTruthy(),
    );
    enabled = true;
    fireEvent.focus(window);
    expect(
      await screen.findByRole("link", { name: "Continue with Google" }),
    ).toBeTruthy();
  });

  it("allows retrying a failed provider request", async () => {
    let failed = true;
    reply("GET", {
      "/auth/providers": () =>
        failed
          ? fail(503, "Unavailable")
          : ok({ google: true, email: true, uploads: true }),
    });
    view(<Login account={null} onAccount={vi.fn()} />);
    await screen.findByRole("button", { name: "Retry Google sign-in check" });
    failed = false;
    fireEvent.click(
      screen.getByRole("button", { name: "Retry Google sign-in check" }),
    );
    expect(
      await screen.findByRole("link", { name: "Continue with Google" }),
    ).toBeTruthy();
  });
});
