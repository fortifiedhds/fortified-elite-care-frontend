import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, messageFor, readResponse } from "../../shared/api/client";
import { adminConsolePath } from "../../shared/lib/admin";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { PasswordInput } from "../../shared/ui/PasswordInput";
import { AuthLayout } from "./components/AuthLayout";
export function ResetPassword({
  admin = false,
  onSignOut,
}: {
  admin?: boolean;
  onSignOut: () => void;
}) {
  const [grant, setGrant] = useState<{ expiresAt: string; admin: boolean }>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [now, setNow] = useState(Date.now());
  useEffect(() => {
    const controller = new AbortController();
    void api
      .GET("/auth/password-recovery/grant", { signal: controller.signal })
      .then((result) => {
        const grant = readResponse(result);
        if (controller.signal.aborted) return;
        if (grant.admin !== admin) {
          setError(
            "Start password recovery again from the correct sign-in page.",
          );
          return;
        }
        setGrant(grant);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(messageFor(error));
      });
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [admin]);
  const expired = Boolean(grant && Date.parse(grant.expiresAt) <= now),
    login = admin ? adminConsolePath : "/login",
    restart = admin
      ? adminConsolePath + "/forgot-password"
      : "/forgot-password";
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("Your new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      readResponse(
        await api.POST("/auth/password-recovery/complete", {
          body: { newPassword: password, confirmPassword: confirmation },
        }),
      );
      setPassword("");
      setConfirmation("");
      setSaved(true);
      onSignOut();
    } catch (error) {
      setError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout
      title={saved ? "Password updated." : "Set a new password."}
      subtitle={
        saved
          ? "Your password has been reset and all devices have been signed out."
          : "Choose a strong password that you haven’t used elsewhere."
      }
    >
      <ErrorMessage>{error}</ErrorMessage>
      {saved ? (
        <Link className="button primary" to={login}>
          Sign in with your new password
        </Link>
      ) : (
        <>
          {expired ? (
            <p role="alert">
              Your recovery session has expired. Request a new code.
            </p>
          ) : grant ? (
            <form className="stack" onSubmit={submit}>
              <label>
                New password
                <PasswordInput
                  autoComplete="new-password"
                  visibilityLabel="new password"
                  required
                  minLength={12}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                />
              </label>
              <label>
                Confirm new password
                <PasswordInput
                  autoComplete="new-password"
                  visibilityLabel="confirm new password"
                  required
                  minLength={12}
                  maxLength={128}
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  disabled={busy}
                />
              </label>
              <p className="muted">
                Use at least 12 characters. This recovery session lasts five
                minutes. You’ll sign in again after saving.
              </p>
              <button className="button primary" disabled={busy}>
                {busy ? "Saving…" : "Save new password"}
              </button>
            </form>
          ) : (
            !error && <p role="status">Checking your recovery session…</p>
          )}
          <p className="form-footer">
            <Link className="text-link" to={restart}>
              Request a new code
            </Link>
          </p>
          <Link className="text-link" to={login}>
            Back to sign in
          </Link>
        </>
      )}
    </AuthLayout>
  );
}
