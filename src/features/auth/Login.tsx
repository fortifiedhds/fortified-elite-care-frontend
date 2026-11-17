import { ArrowRight } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api, messageFor, readResponse } from "../../shared/api/client";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { AuthLayout } from "./components/AuthLayout";
import type { Props } from "./types";

export function Login({ account, onAccount }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (account) return <Navigate to="/portal" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      onAccount(
        readResponse(
          await api.POST("/auth/login", { body: { email, password } }),
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
      title="Sign in to your portal."
      subtitle="Use the email address associated with your account."
    >
      <form onSubmit={submit} className="stack">
        <label>
          Email address
          <input
            autoComplete="username"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            autoComplete="current-password"
            type="password"
            minLength={12}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <ErrorMessage>{error}</ErrorMessage>
        <button className="button primary" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      </form>
      {/* <Link to="/account-help">Need help signing in?</Link> */}
      <p className="form-footer">
        New to Fortified Elite Care?{" "}
        <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
