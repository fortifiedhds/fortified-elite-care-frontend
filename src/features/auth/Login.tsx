import { PasswordInput } from "../../shared/ui/PasswordInput";
import { ArrowRight } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { authReturnPath } from "../../shared/lib/auth-return";
import {
  api,
  apiBase,
  messageFor,
  readResponse,
} from "../../shared/api/client";
import {
  adminConsolePath,
  adminVerificationPath,
} from "../../shared/lib/admin";
import { siteHref } from "../../shared/lib/sites";
import { SiteRedirect } from "../../shared/ui/SiteRedirect";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { AuthLayout } from "./components/AuthLayout";
import type { Props } from "./types";

export function Login({
  account,
  onAccount,
  admin = false,
}: Props & { admin?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [google, setGoogle] = useState(false);
  const [providerError, setProviderError] = useState("");
  const [providerCheck, setProviderCheck] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    params.has("google")
      ? "Google sign-in could not be completed. Please try again or use your password."
      : "",
  );
  useEffect(() => {
    if (admin) return;
    let controller: AbortController;
    function checkProviders() {
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;
      void api
        .GET("/auth/providers", { signal })
        .then((result) => {
          if (signal.aborted) return;
          setGoogle(readResponse(result).google);
          setProviderError("");
        })
        .catch(() => {
          if (!signal.aborted)
            setProviderError(
              "Google sign-in could not be checked. Please try again.",
            );
        });
    }
    checkProviders();
    window.addEventListener("focus", checkProviders);
    return () => {
      controller.abort();
      window.removeEventListener("focus", checkProviders);
    };
  }, [admin, providerCheck]);
  if (account)
    return (
      <SiteRedirect
        to={
          account.role === "ADMIN"
            ? siteHref(
                "admin",
                authReturnPath(location.state?.returnTo, true) ??
                  adminConsolePath,
              )
            : (authReturnPath(location.state?.returnTo, false) ?? "/portal")
        }
      />
    );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = readResponse(
        await api.POST(admin ? "/auth/admin/login" : "/auth/login", {
          body: { email, password },
        }),
      );
      if (result.challenge)
        navigate(admin ? adminVerificationPath : "/verify-email", {
          state: {
            returnTo: admin ? location.pathname : location.state?.returnTo,
          },
        });
      else if (result.account) onAccount(result.account);
    } catch (error) {
      setError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title={admin ? "Administrator sign in." : "Sign in to your portal."}
      subtitle={
        admin
          ? "Use your administrator account. An email code will confirm your sign-in."
          : "Use the email address associated with your account."
      }
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
          <PasswordInput
            autoComplete="current-password"

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
      {!admin && (
        <div className="stack">
          <div className="auth-divider">
            <span>or</span>
          </div>
          {google ? (
            <a
              className="button outline google-button"
              href={apiBase + "/auth/google"}
            >
              <img
                src="/brand/google-g.png"
                width={20}
                height={20}
                alt=""
                aria-hidden="true"
              />
              <span>Continue with Google</span>
            </a>
          ) : providerError ? (
            <>
              <p className="muted" role="status">
                {providerError}
              </p>
              <button
                className="button outline"
                onClick={() => setProviderCheck((value) => value + 1)}
              >
                Retry Google sign-in check
              </button>
            </>
          ) : (
            <button className="button outline" disabled>
              Google sign-in is being configured
            </button>
          )}
          {/* <p className="muted">
            New here? Continue with Google, then choose a patient or doctor
            profile.
          </p> */}
        </div>
      )}
      {!admin && (
        <p className="form-footer">
          New to Fortified Elite Care?{" "}
          <Link to="/register">Create an account</Link>
        </p>
      )}
    </AuthLayout>
  );
}
