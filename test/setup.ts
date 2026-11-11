import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { api } from "../src/shared/api/client";

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  for (const method of ["GET", "POST", "PATCH"] as const) {
    vi.spyOn(api, method).mockImplementation(async (path) => {
      throw new Error("Unexpected test request: " + method + " " + path);
    });
  }
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
