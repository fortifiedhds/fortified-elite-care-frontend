import { useEffect } from "react";
import { Navigate } from "react-router-dom";

export function SiteRedirect({ to }: { to: string }) {
  const external =
    new URL(to, window.location.origin).origin !== window.location.origin;
  useEffect(() => {
    if (external) window.location.replace(to);
  }, [external, to]);
  return external ? (
    <main className="wrap section" id="main-content" role="status">
      Opening your workspace…
    </main>
  ) : (
    <Navigate to={to} replace />
  );
}
