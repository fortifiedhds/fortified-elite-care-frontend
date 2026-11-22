import { Link } from "react-router-dom";
import { siteHref } from "../../../shared/lib/sites";
import { ErrorMessage } from "../../../shared/ui/Feedback";
export function SignInFeedback({
  message,
  support,
}: {
  message: string;
  support: { reference?: string } | null;
}) {
  if (!message) return null;
  return (
    <div className="auth-error-feedback">
      <ErrorMessage>{message}</ErrorMessage>
      {support && (
        <>
          <Link className="text-link" to={siteHref("public", "/contact")}>
            Get help signing in
          </Link>
          {support.reference && (
            <details className="auth-support-details">
              <summary>Details for support</summary>
              <p>Share this reference with our care team:</p>
              <code>{support.reference}</code>
            </details>
          )}
        </>
      )}
    </div>
  );
}
