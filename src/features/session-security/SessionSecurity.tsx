import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { api, messageFor, readResponse } from "../../shared/api/client";
import { sessionState } from "../../shared/api/session-state";
import { ErrorMessage } from "../../shared/ui/Feedback";
export function SessionSecurity({ onExpired }: { onExpired: () => void }) {
  const times = useSyncExternalStore(sessionState.subscribe, sessionState.get);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lastActivity = useRef(0),
    warned = useRef<number | undefined>(undefined);
  const deadline = times ? Math.min(times.absolute, times.idle) : Infinity;
  const warning = deadline - now <= 120_000 && deadline > now;
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!times) return;
    if (deadline <= now) {
      onExpired();
      return;
    }
    if (warning && warned.current !== deadline) {
      warned.current = deadline;
      window.dispatchEvent(new Event("fec:session-warning"));
    }
  }, [deadline, now, onExpired, times, warning]);
  async function continueSession() {
    setBusy(true);
    setError("");
    try {
      readResponse(await api.POST("/auth/session/continue"));
      setNow(Date.now());
    } catch (error) {
      setError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }
  const action = useRef(continueSession);
  action.current = continueSession;
  const remaining = useRef({ deadline, warning });
  remaining.current = { deadline, warning };
  useEffect(() => {
    function activity(event: Event) {
      if (
        !event.isTrusted ||
        !Number.isFinite(remaining.current.deadline) ||
        (event.target instanceof Element &&
          event.target.closest(".session-warning")) ||
        remaining.current.deadline <= Date.now() ||
        Date.now() - lastActivity.current < 60_000
      )
        return;
      lastActivity.current = Date.now();
      void action.current();
    }
    for (const name of ["pointerdown", "keydown", "scroll", "touchstart"])
      window.addEventListener(name, activity, { passive: true });
    return () => {
      for (const name of ["pointerdown", "keydown", "scroll", "touchstart"])
        window.removeEventListener(name, activity);
    };
  }, []);
  if (!warning) return null;
  const absoluteEnding = times && times.absolute - now <= 120_000;
  return (
    <aside
      className="session-warning panel stack"
      role="alert"
      aria-label="Session expiry warning"
    >
      <strong>
        Your session ends in {Math.ceil((deadline - now) / 1000)} seconds.
      </strong>
      <p>
        {absoluteEnding
          ? "Please save your work and sign in again."
          : "Stay signed in to continue. Your editable care forms will try to save a draft before the session ends."}
      </p>
      <ErrorMessage>{error}</ErrorMessage>
      {!absoluteEnding && (
        <button
          className="button primary small"
          disabled={busy}
          onClick={() => void continueSession()}
        >
          {busy ? "Checking…" : "Stay signed in"}
        </button>
      )}
    </aside>
  );
}
