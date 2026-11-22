import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, messageFor, readResponse } from "../../shared/api/client";
import { adminConsolePath } from "../../shared/lib/admin";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { AuthLayout } from "./components/AuthLayout";
import { VerificationForm } from "./VerificationForm";
import type { Challenge } from "./VerificationForm";
export function ForgotPassword({ admin = false }: { admin?: boolean }) {
  const navigate = useNavigate(),
    [email, setEmail] = useState(""),
    [challenge, setChallenge] = useState<Challenge>(),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const login = admin ? adminConsolePath : "/login";
  useEffect(() => {
    const controller = new AbortController();
    void api
      .GET("/auth/password-recovery/challenge", { signal: controller.signal })
      .then((response) => {
        const result = readResponse(response);
        if (!controller.signal.aborted && result.admin === admin)
          setChallenge(result.challenge);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(messageFor(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [admin]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      setChallenge(
        readResponse(
          await api.POST("/auth/password-recovery/request", {
            body: { email, admin },
          }),
        ),
      );
    } catch (error) {
      setError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout
      title={challenge ? "Check your email." : "Forgot your password?"}
      subtitle={
        challenge
          ? "If this email is eligible for password recovery, we’ve sent instructions."
          : "Enter the email address you use to sign in."
      }
    >
      <ErrorMessage>{error}</ErrorMessage>
      {loading ? (
        <p role="status">Checking your recovery request…</p>
      ) : challenge ? (
        <>
          <VerificationForm
            key={challenge.expiresAt}
            initial={challenge}
            label="Verify recovery code"
            verify={async (code) => {
              readResponse(
                await api.POST("/auth/password-recovery/verify", {
                  body: { code },
                }),
              );
              navigate(
                admin
                  ? adminConsolePath + "/reset-password"
                  : "/reset-password",
                { replace: true },
              );
            }}
          />
          <p className="muted">
            Use the latest code from your email in this browser. Your code
            expires after 10 minutes.
          </p>
          <button
            className="button outline"
            type="button"
            onClick={() => {
              setChallenge(undefined);
              setError("");
            }}
          >
            Start a new request
          </button>
        </>
      ) : (
        <form className="stack" onSubmit={submit}>
          <label>
            Email address
            <input
              type="email"
              autoComplete="username"
              value={email}
              required
              maxLength={254}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </label>
          <p className="muted">
            We’ll send instructions if this address is eligible. For your
            privacy, we won’t confirm whether an account exists.
          </p>
          <button className="button primary" disabled={busy}>
            {busy ? "Sending…" : "Send recovery instructions"}
          </button>
        </form>
      )}
      {!admin && (
        <p className="form-footer">
          This also works if you first joined with Google. After verifying your
          email, you can create a password and keep using Google too.
        </p>
      )}
      <p className="form-footer">
        <Link className="text-link" to={login}>
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
