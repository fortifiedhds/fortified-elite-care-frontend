import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AccountHelp } from "../features/auth/AccountHelp";
import { Login } from "../features/auth/Login";
import { Register } from "../features/auth/Register";
import { Portal } from "../features/portal/Portal";
import { PublicHome } from "../features/public/PublicHome";
import { PublicPage } from "../features/public/PublicPage";
import { publicPages } from "../features/public/content";
import type { Account } from "../shared/api/client";
import { api } from "../shared/api/client";

export function App() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const onSignOut = useCallback(() => setAccount(null), []);
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
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Routes>
        <Route path="/" element={<PublicHome signedIn={!!account} />} />
        {publicPages.map((page) => (
          <Route
            key={page}
            path={"/" + page}
            element={<PublicPage page={page} signedIn={!!account} />}
          />
        ))}
        <Route path="/login" element={<Login {...identity} />} />
        <Route path="/account-help" element={<AccountHelp />} />
        <Route path="/register" element={<Register {...identity} />} />
        <Route
          path="/portal/*"
          element={
            loading ? (
              <main id="main-content" className="wrap section" role="status">
                Checking your session…
              </main>
            ) : account ? (
              <Portal account={account} onSignOut={onSignOut} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="*"
          element={
            <main className="wrap section" id="main-content">
              <h1>Page unavailable</h1>
              <Link to="/">Go to Fortified Elite Care</Link>
            </main>
          }
        />
      </Routes>
    </>
  );
}
