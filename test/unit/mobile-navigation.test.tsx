import {
  act,
  cleanup,
  fireEvent,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useNavigate } from "react-router-dom";
import { PublicHeader } from "../../src/features/public/components/PublicLayout";
import { Portal } from "../../src/features/portal/Portal";
import { dashboard, ok, patient, reply, view } from "../fixtures";

function mobileViewport() {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const media = {
    matches: true,
    media: "(max-width: 1050px)",
    addEventListener: (
      _name: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.add(listener),
    removeEventListener: (
      _name: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.delete(listener),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => media),
  );
  return (matches: boolean) => {
    media.matches = matches;
    act(() =>
      listeners.forEach((listener) =>
        listener({ matches } as MediaQueryListEvent),
      ),
    );
  };
}
function PublicShell() {
  const navigate = useNavigate();
  return (
    <>
      <PublicHeader signedIn={false} />
      <main>
        <h1>Page content</h1>
        <button onClick={() => navigate("/services")}>
          Simulate route change
        </button>
        <button onClick={() => navigate(-1)}>Simulate browser back</button>
      </main>
      <footer>Footer content</footer>
    </>
  );
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
});

describe("mobile navigation lifecycle", () => {
  it("hides closed navigation and opens the existing links with background scroll and interaction locked", async () => {
    mobileViewport();
    view(<PublicShell />);
    expect(screen.queryByRole("link", { name: "How it works" })).toBeNull();
    const panel = document.getElementById("public-navigation")!;
    expect(panel.hasAttribute("inert")).toBe(true);
    const toggle = screen.getByRole("button", { name: "Open navigation" });
    await userEvent.setup().click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(panel.hasAttribute("inert")).toBe(false);
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.documentElement.style.overflow).toBe("");
    expect(document.querySelector("main")?.hasAttribute("inert")).toBe(true);
    expect(document.querySelector("footer")?.hasAttribute("inert")).toBe(true);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.textContent?.trim()),
    ).toEqual([
      "How it works",
      "About",
      "Services",
      "For families",
      "For doctors",
      "Sign in",
      "Explore care",
    ]);
    expect(document.activeElement).toBe(
      within(nav).getByRole("link", { name: "How it works" }),
    );
  });
  it("keeps keyboard focus inside the menu and restores focus, scrolling and background access on Escape", async () => {
    mobileViewport();
    document.body.style.overflow = "clip";
    document.documentElement.style.overflow = "auto";
    view(<PublicShell />);
    const user = userEvent.setup();
    const button = screen.getByRole("button", { name: "Open navigation" });
    await user.click(button);
    const last = screen.getByRole("link", { name: "Explore care" }),
      first = screen.getByRole("link", { name: "Fortified Elite Care home" });
    last.focus();
    await user.tab();
    expect(document.activeElement).toBe(first);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(last);
    await user.keyboard("{Escape}");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(button);
    expect(document.body.style.overflow).toBe("clip");
    expect(document.documentElement.style.overflow).toBe("auto");
    expect(document.querySelector("main")?.hasAttribute("inert")).toBe(false);
  });
  it("closes when selecting the current page as well as a different page", async () => {
    mobileViewport();
    view(<PublicShell />, "/for-families");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    await user.click(screen.getByRole("link", { name: "For families" }));
    expect(
      screen
        .getByRole("button", { name: "Open navigation" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    await user.click(screen.getByRole("link", { name: "Services" }));
    expect(screen.getByLabelText("Current route").textContent).toBe(
      "/services",
    );
    expect(document.body.style.overflow).toBe("");
  });
  it("closes on programmatic navigation and stays closed after returning through history", async () => {
    mobileViewport();
    view(<PublicShell />);
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    // Represents navigation initiated outside the menu, such as the browser history controls.
    fireEvent.click(
      screen.getByRole("button", { name: "Simulate route change" }),
    );
    expect(
      screen
        .getByRole("button", { name: "Open navigation" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
    fireEvent.click(
      screen.getByRole("button", { name: "Simulate browser back" }),
    );
    expect(screen.getByLabelText("Current route").textContent).toBe("/");
    expect(screen.queryByRole("link", { name: "How it works" })).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });
  it("clears the open menu on desktop resize and restores all state on unmount", async () => {
    const resize = mobileViewport();
    const page = view(<PublicShell />);
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    resize(false);
    expect(document.body.style.overflow).toBe("");
    expect(
      screen
        .getByRole("button", { name: "Open navigation" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
    expect(screen.getByRole("link", { name: "How it works" })).toBeTruthy();
    resize(true);
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(document.body.style.overflow).toBe("hidden");
    page.unmount();
    expect(document.body.style.overflow).toBe("");
    expect(document.documentElement.style.overflow).toBe("");
  });
  it("retains pre-existing inert state when closing", () => {
    mobileViewport();
    view(
      <>
        <PublicHeader signedIn={false} />
        <main inert>Already unavailable</main>
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    fireEvent.click(screen.getByRole("button", { name: "Close navigation" }));
    expect(document.querySelector("main")?.hasAttribute("inert")).toBe(true);
  });
  it("uses the same menu controls in patient portals and closes on selecting an appointment page", async () => {
    mobileViewport();
    reply("GET", { "/dashboard": ok(dashboard(patient)) });
    view(<Portal account={patient} onSignOut={vi.fn()} />, "/portal");
    await screen.findByRole("heading", { name: "Welcome, Test Patient" });
    fireEvent.click(
      screen.getByRole("button", { name: "Open portal navigation" }),
    );
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.querySelector("main")?.hasAttribute("inert")).toBe(true);
    expect(
      screen.getByRole("button", { name: "Close portal navigation" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("link", { name: "Appointments" }));
    expect(screen.getByLabelText("Current route").textContent).toBe(
      "/portal/appointments",
    );
    expect(document.getElementById("portal-navigation")?.hidden).toBe(true);
    expect(document.querySelector("main")?.hasAttribute("inert")).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });
});
