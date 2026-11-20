import { Link } from "react-router-dom";
import { useState } from "react";
import { api, messageFor, readResponse } from "../../shared/api/client";
import { adminConsolePath } from "../../shared/lib/admin";
import { siteHref } from "../../shared/lib/sites";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { Portal } from "../portal/Portal";
import { AuthLayout } from "./components/AuthLayout";
import { Login } from "./Login";
import type { Props } from "./types";

export function AdminConsole({
  account,
  onAccount,
  loading,
  onSignOut,
}: Props & { loading: boolean; onSignOut: () => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (loading)
    return (
      <main className="wrap section" id="main-content" role="status">
        Checking administrator access…
      </main>
    );
  if (!account) return <Login account={null} onAccount={onAccount} admin />;
  if (account.role !== "ADMIN")
    return (
      <AuthLayout
        title="Administrator console."
        subtitle="Sign in with a separate administrator account."
      >
        <ErrorMessage>{error}</ErrorMessage>
        <button
          className="button primary"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setError("");
            void api
              .POST("/auth/logout")
              .then(readResponse)
              .then(onSignOut)
              .catch((error) => setError(messageFor(error)))
              .finally(() => setBusy(false));
          }}
        >
          {busy ? "Signing out…" : "Sign out of this account"}
        </button>
        <Link to={siteHref("dashboard", "/portal")}>Return to your portal</Link>
      </AuthLayout>
    );
  return (
    <Portal
      account={account}
      onSignOut={onSignOut}
      basePath={adminConsolePath}
    />
  );
}
