import config from "../../vercel.json";
import { expect, it } from "vitest";
import { resolveApiBase, vercelApiTarget } from "../../src/shared/api/base-url";
const hosted = "https://fortified-elite-care-frontend.vercel.app";
it("uses the browser-visible Vercel host for every API endpoint when the configured API is the proxy target", () => {
  for (const origin of [hosted, "https://fec-preview-123.vercel.app"]) {
    const base = resolveApiBase(vercelApiTarget + "/", origin);
    expect(base).toBe(origin + "/api/v1");
    for (const path of [
      "/auth/login",
      "/auth/csrf",
      "/auth/verify",
      "/auth/google",
      "/auth/google/callback",
      "/doctors/credentials",
      "/files/example/download",
      "/auth/logout",
    ])
      expect(new URL(base + path).origin).toBe(origin);
  }
});
it("keeps local development and the planned FEC API subdomain configurable", () => {
  expect(resolveApiBase(undefined, "http://localhost:5173")).toBe(
    "http://127.0.0.1:3000/api/v1",
  );
  expect(
    resolveApiBase("http://127.0.0.1:3000/api/v1/", "http://127.0.0.1:5173"),
  ).toBe("http://127.0.0.1:3000/api/v1");
  expect(
    resolveApiBase(
      "https://api.fortifiedelitecare.com/api/v1",
      "https://dashboard.fortifiedelitecare.com",
    ),
  ).toBe("https://api.fortifiedelitecare.com/api/v1");
  expect(resolveApiBase("/api/v1", hosted)).toBe(hosted + "/api/v1");
  expect(resolveApiBase("https://other.example.test/api/v1", hosted)).toBe(
    "https://other.example.test/api/v1",
  );
});
it("does not treat unrelated hostnames as Vercel or redirect other API paths to the proxy", () => {
  expect(
    resolveApiBase(vercelApiTarget, "https://vercel.app.attacker.test"),
  ).toBe(vercelApiTarget);
  expect(resolveApiBase(vercelApiTarget + "-other", hosted)).toBe(
    vercelApiTarget + "-other",
  );
});
it("rejects credentials, query parameters, fragments and non-HTTP public API bases", () => {
  for (const value of [
    "javascript:alert(1)",
    "ftp://example.test/api",
    "https://user:password@example.test/api/v1",
    "https://api.example.test/api/v1?secret=value",
    "https://api.example.test/api/v1#fragment",
  ])
    expect(() => resolveApiBase(value, hosted)).toThrow();
});
it("uses a fixed external API rewrite before SPA routes, with the build consuming the same target", () => {
  expect(config.rewrites[0]).toEqual({
    source: "/api/v1/:path*",
    destination: vercelApiTarget + "/:path*",
  });
  expect(
    config.rewrites
      .slice(1)
      .some((r: { destination: string }) => r.destination === "/index.html"),
  ).toBe(true);
  expect(new URL(vercelApiTarget).protocol).toBe("https:");
});
