import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { api } from "./api/client";
import type { Account } from "./api/client";
import { Login, Register } from "./auth";
import { DoctorsPage, PublicHome } from "./public";
import { Portal } from "./portal";
import "./styles.css";

function App() {
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
  }, [location.pathname, location.hash]);

  const identity = { account, onAccount: setAccount };
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Routes>
        <Route path="/" element={<PublicHome signedIn={!!account} />} />
        <Route
          path="/for-doctors"
          element={<DoctorsPage signedIn={!!account} />}
        />
        <Route path="/login" element={<Login {...identity} />} />
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

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
