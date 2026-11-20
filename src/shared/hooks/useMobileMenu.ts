import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const focusable =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useMobileMenu<Shell extends HTMLElement = HTMLElement>(
  breakpoint: number,
) {
  const { key } = useLocation();
  const query = `(max-width: ${breakpoint}px)`;
  const [mobile, setMobile] = useState(
    () => window.matchMedia?.(query).matches ?? false,
  );
  const [state, setState] = useState({ route: key, open: false });
  // Reset on navigation, including history changes, so returning to a route cannot reopen its menu.
  if (state.route !== key) setState({ route: key, open: false });
  const open = state.route === key && state.open;
  const shellRef = useRef<Shell>(null);
  const panelRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(
    () => setState((value) => ({ ...value, open: false })),
    [],
  );
  const toggle = () =>
    setState((value) => ({
      route: key,
      open: value.route === key ? !value.open : true,
    }));

  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return;
    const change = (event: MediaQueryListEvent) => {
      setMobile(event.matches);
      if (!event.matches) close();
    };
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, [query, close]);

  useEffect(() => {
    if (!open) return;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const hidden: { element: HTMLElement; previous: string | null }[] = [];
    let branch: HTMLElement | null = shellRef.current;
    while (branch?.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (
          sibling instanceof HTMLElement &&
          sibling !== branch &&
          !["SCRIPT", "STYLE"].includes(sibling.tagName)
        ) {
          hidden.push({
            element: sibling,
            previous: sibling.getAttribute("inert"),
          });
          sibling.setAttribute("inert", "");
        }
      }
      if (branch.parentElement === document.body) break;
      branch = branch.parentElement;
    }
    const enabled = () =>
      Array.from(
        shellRef.current?.querySelectorAll<HTMLElement>(focusable) ?? [],
      ).filter(
        (element) =>
          !element.closest("[inert], [hidden]") &&
          getComputedStyle(element).display !== "none" &&
          getComputedStyle(element).visibility !== "hidden",
      );
    panelRef.current
      ?.querySelector<HTMLElement>(focusable)
      ?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "Tab") {
        const items = enabled(),
          first = items[0],
          last = items.at(-1);
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            !shellRef.current?.contains(document.activeElement))
        ) {
          event.preventDefault();
          last?.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !shellRef.current?.contains(document.activeElement))
        ) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const button = toggleRef.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = bodyOverflow;
      for (const { element, previous } of hidden) {
        if (previous === null) element.removeAttribute("inert");
        else element.setAttribute("inert", previous);
      }
      if (button?.isConnected) button.focus({ preventScroll: true });
    };
  }, [open, close]);

  return { open, mobile, toggle, close, shellRef, panelRef, toggleRef };
}
