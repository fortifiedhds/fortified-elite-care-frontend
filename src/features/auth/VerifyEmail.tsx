import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { api, messageFor, readResponse } from "../../shared/api/client";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { adminConsolePath } from "../../shared/lib/admin";
import { siteHref } from "../../shared/lib/sites";
import { AuthLayout } from "./components/AuthLayout";
import type { Props } from "./types";
import { VerificationForm } from "./VerificationForm";
import type { Challenge } from "./VerificationForm";

export function VerifyEmail({ onAccount }: Pick<Props, "onAccount">) {
  const [challenge, setChallenge] = useState<Challenge>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const admin =
    challenge?.purpose === "ADMIN_LOGIN" ||
    params.get("admin") === "1" ||
    location.pathname.startsWith(adminConsolePath + "/");
  const registrationRole = location.state?.registrationRole;
  const registrationHref =
    !admin && (registrationRole === "patient" || registrationRole === "doctor")
      ? `/register?role=${registrationRole}`
      : null;
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    void api
      .GET("/auth/challenge", { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setChallenge(readResponse(result));
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(messageFor(error));
      });
    return () => controller.abort();
  }, [attempt]);
  return (
    <AuthLayout
      title="Check your email."
      subtitle="Use your verification code to continue securely."
    >
      <ErrorMessage>{error}</ErrorMessage>
      {challenge ? (
        <VerificationForm
          initial={challenge}
          verify={async (code) => {
            const result = readResponse(
              await api.POST("/auth/verify", { body: { code } }),
            );
            if (result.onboarding)
              navigate("/google/onboarding", { replace: true });
            else if (result.account) {
              onAccount(result.account);
              navigate(
                result.account.role === "ADMIN"
                  ? adminConsolePath
                  : challenge.purpose === "SIGNUP" &&
                      result.account.role === "PATIENT"
                    ? "/portal/registration"
                    : result.account.role === "DOCTOR" &&
                        result.account.reviewStatus === "PENDING"
                      ? "/portal/credentials"
                      : "/portal",
                { replace: true },
              );
            }
          }}
        />
      ) : (
        !error && <p role="status">Loading verification…</p>
      )}
      {error && !challenge && (
        <div className="actions">
          <button
            type="button"
            className="button outline"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Try again
          </button>
          {registrationHref && (
            <Link className="button primary" to={registrationHref}>
              Restart registration
            </Link>
          )}
        </div>
      )}
      <Link to={admin ? siteHref("admin", adminConsolePath) : "/login"}>
        Back to sign in
      </Link>
    </AuthLayout>
  );
}
