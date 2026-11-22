import { PasswordInput } from "../../shared/ui/PasswordInput";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, messageFor, readResponse } from "../../shared/api/client";
import type { components } from "../../shared/api/schema";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { VerificationForm } from "../auth/VerificationForm";
import type { Challenge } from "../auth/VerificationForm";

export function Settings({ onSignOut }: { onSignOut?: () => void } = {}) {
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
            label={
              challenge.purpose === "SESSION_REVOKE"
                ? "Sign out all devices"
                : "Confirm password update"
            }
            verify={async (code) => {
              if (challenge.purpose === "SESSION_REVOKE") {
                readResponse(
                  await api.POST("/auth/sessions/revoke/confirm", {
                    body: { code },
                  }),
                );
                setChallenge(undefined);
                onSignOut?.();
                setNotice("All devices have been signed out.");
                return;
              }
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
            {challenge.purpose === "SESSION_REVOKE"
              ? "Cancel sign-out"
              : "Cancel password update"}
          </button>
        </>
      ) : security ? (
        <form className="stack" onSubmit={submit}>
          {security.hasPassword && (
            <label>
              Current password
              <PasswordInput
                visibilityLabel="current password"
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
            <PasswordInput
              visibilityLabel="new password"
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
            <PasswordInput
              visibilityLabel="confirm new password"
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
      {security && !challenge && (
        <div className="stack">
          <h3>Signed-in devices</h3>
          <p>
            Sign out every device, including this one. An email code will
            confirm your request.
          </p>
          <div className="actions">
            <button
              type="button"
              className="button outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                setNotice("");
                try {
                  setChallenge(
                    readResponse(await api.POST("/auth/sessions/revoke")),
                  );
                } catch (error) {
                  setError(messageFor(error));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Sign out all devices
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
