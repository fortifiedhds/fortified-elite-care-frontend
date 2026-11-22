import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AccountHelp } from "../features/auth/AccountHelp";
import { ForgotPassword } from "../features/auth/ForgotPassword";
import { ResetPassword } from "../features/auth/ResetPassword";
import { Login } from "../features/auth/Login";
import { Register } from "../features/auth/Register";
import { VerifyEmail } from "../features/auth/VerifyEmail";
import { GoogleOnboarding } from "../features/auth/GoogleOnboarding";
import { AdminConsole } from "../features/auth/AdminConsole";
import { adminConsolePath, adminVerificationPath } from "../shared/lib/admin";
import { currentSurface, siteHref } from "../shared/lib/sites";
import { isAppRoute, publicPages } from "../shared/lib/routes";
import { NotFound } from "../features/public/NotFound";
import { SiteRedirect } from "../shared/ui/SiteRedirect";
import { Portal } from "../features/portal/Portal";
import { PublicHome } from "../features/public/PublicHome";
import { PublicPage } from "../features/public/PublicPage";
import type { Account } from "../shared/api/client";
import { api } from "../shared/api/client";
import { SessionSecurity } from "../features/session-security/SessionSecurity";
import { sessionState } from "../shared/api/session-state";
import {
  DraftIdentity,
  clearMemoryDrafts,
} from "../features/session-security/draft-memory";

export function App() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const previousAccount = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (account) {
      if (previousAccount.current && previousAccount.current !== account.id)
        clearMemoryDrafts();
      previousAccount.current = account.id;
    }
  }, [account]);
  const onSignOut = useCallback(() => {
    clearMemoryDrafts();
    sessionState.set(null);
    setAccount(null);
  }, []);
  const onExpired = useCallback(() => setAccount(null), []);
  const location = useLocation();

  useEffect(() => {
    const controller = new AbortController();
    void api
      .GET("/auth/me", { signal: controller.signal })
      .then(({ data }) => {
        if (data && !controller.signal.aborted) setAccount(data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
    else if (location.hash === "#packages")
      document.getElementById("packages")?.scrollIntoView();
  }, [location.pathname, location.hash]);

  const identity = { account, onAccount: setAccount };
  const surface = currentSurface();
  if (!isAppRoute(location.pathname, surface))
    return <NotFound signedIn={!!account} />;
  return (
    <DraftIdentity.Provider value={account?.id}>
      {account && <SessionSecurity onExpired={onExpired} />}
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Routes>
        <Route
          path="/"
          element={
            surface === "dashboard" ? (
              <Navigate to="/portal" replace />
            ) : (
              <PublicHome signedIn={!!account} />
            )
          }
        />
        {(surface === "combined" || surface === "public") &&
          publicPages.map((page) => (
            <Route
              key={page}
              path={"/" + page}
              element={<PublicPage page={page} signedIn={!!account} />}
            />
          ))}
        <Route path="/login" element={<Login {...identity} />} />
        <Route path="/account-help" element={<AccountHelp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/reset-password"
          element={<ResetPassword onSignOut={onSignOut} />}
        />
        <Route
          path={adminConsolePath + "/forgot-password"}
          element={<ForgotPassword admin />}
        />
        <Route
          path={adminConsolePath + "/reset-password"}
          element={<ResetPassword admin onSignOut={onSignOut} />}
        />
        <Route path="/register" element={<Register {...identity} />} />
        <Route
          path="/verify-email"
          element={<VerifyEmail onAccount={setAccount} />}
        />
        <Route
          path={adminVerificationPath}
          element={<VerifyEmail onAccount={setAccount} />}
        />
        <Route
          path="/google/onboarding"
          element={<GoogleOnboarding {...identity} />}
        />
        <Route
          path={adminConsolePath + "/*"}
          element={
            <AdminConsole
              {...identity}
              loading={loading}
              onSignOut={onSignOut}
            />
          }
        />
        <Route
          path="/portal/*"
          element={
            loading ? (
              <main id="main-content" className="wrap section" role="status">
                Checking your session…
              </main>
            ) : account?.role === "ADMIN" ? (
              <SiteRedirect to={siteHref("admin", adminConsolePath)} />
            ) : account ? (
              <Portal account={account} onSignOut={onSignOut} />
            ) : (
              <Navigate
                to="/login"
                state={{ returnTo: location.pathname }}
                replace
              />
            )
          }
        />
        <Route path="*" element={<NotFound signedIn={!!account} />} />
      </Routes>
    </DraftIdentity.Provider>
  );
}
