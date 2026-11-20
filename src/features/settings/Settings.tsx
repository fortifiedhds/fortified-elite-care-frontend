import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, messageFor, readResponse } from "../../shared/api/client";
import type { components } from "../../shared/api/schema";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { VerificationForm } from "../auth/VerificationForm";
import type { Challenge } from "../auth/VerificationForm";

export function Settings() {
  const [security, setSecurity] =
    useState<components["schemas"]["SecurityView"]>();
  const [challenge, setChallenge] = useState<Challenge>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirmation: "",
  });
  useEffect(() => {
    const controller = new AbortController();
    void api
      .GET("/auth/security", { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setSecurity(readResponse(result));
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(messageFor(error));
      });
    return () => controller.abort();
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (passwords.next !== passwords.confirmation) {
      setError("Your new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      setChallenge(
        readResponse(
          await api.POST("/auth/password", {
            body: {
              newPassword: passwords.next,
              ...(security?.hasPassword
                ? { currentPassword: passwords.current }
                : {}),
            },
          }),
        ),
      );
      setPasswords({ current: "", next: "", confirmation: "" });
    } catch (error) {
      setError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>{security?.hasPassword ? "Change password" : "Create password"}</h2>
      {security && (
        <p>
          {security.googleLinked
            ? "Google is connected to your account."
            : "You use an email address and password to sign in."}
        </p>
      )}
      <ErrorMessage>{error}</ErrorMessage>
      {notice && (
        <p className="feedback success" role="status">
          {notice}
        </p>
      )}
      {challenge ? (
        <>
          <VerificationForm
            initial={challenge}
            label="Confirm password update"
            verify={async (code) => {
              readResponse(
                await api.POST("/auth/password/confirm", { body: { code } }),
              );
              setChallenge(undefined);
              setSecurity(readResponse(await api.GET("/auth/security")));
              setNotice(
                "Your password is saved. Other signed-in sessions have been signed out.",
              );
            }}
          />
          <button
            className="button outline"
            onClick={() => setChallenge(undefined)}
          >
            Cancel password update
          </button>
        </>
      ) : security ? (
        <form className="stack" onSubmit={submit}>
          {security.hasPassword && (
            <label>
              Current password
              <input
                type="password"
                autoComplete="current-password"
                minLength={12}
                maxLength={128}
                required
                value={passwords.current}
                onChange={(event) =>
                  setPasswords({ ...passwords, current: event.target.value })
                }
              />
            </label>
          )}
          <label>
            New password
            <input
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              value={passwords.next}
              onChange={(event) =>
                setPasswords({ ...passwords, next: event.target.value })
              }
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              value={passwords.confirmation}
              onChange={(event) =>
                setPasswords({ ...passwords, confirmation: event.target.value })
              }
            />
          </label>
          <p className="muted">
            Use at least 12 characters. An email code will confirm this change.
          </p>
          <button className="button primary" disabled={busy}>
            {busy ? "Sending code…" : "Send verification code"}
          </button>
        </form>
      ) : (
        !error && <p role="status">Loading account settings…</p>
      )}
    </section>
  );
}
