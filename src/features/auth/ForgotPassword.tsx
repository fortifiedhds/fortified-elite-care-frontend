import { useState } from "react";
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
    [error, setError] = useState("");
  const login = admin ? adminConsolePath : "/login";
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
          ? "Enter the six-digit OTP to choose a new password."
          : "Enter your email address to receive a one-time passcode (OTP)."
      }
    >
      <ErrorMessage>{error}</ErrorMessage>
      {challenge ? (
        <VerificationForm
          key={challenge.expiresAt}
          initial={challenge}
          label="Verify recovery code"
          expiredMessage="This OTP has expired. Go back to sign in to request another one."
          verify={async (code) => {
            readResponse(
              await api.POST("/auth/password-recovery/verify", {
                body: { code },
              }),
            );
            navigate(
              admin ? adminConsolePath + "/reset-password" : "/reset-password",
              { replace: true },
            );
          }}
        />
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
          <button className="button primary" disabled={busy}>
            {busy ? "Sending OTP…" : "Send OTP"}
          </button>
        </form>
      )}
      <p className="form-footer">
        <Link className="text-link" to={login}>
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
