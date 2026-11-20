import { ArrowRight, DoorOpen, Home, LifeBuoy } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { siteHref } from "../../shared/lib/sites";
import { Footer, PublicHeader } from "./components/PublicLayout";

export function NotFound({ signedIn = false }: { signedIn?: boolean }) {
  useEffect(() => {
    const previous = document.title;
    document.title = "Page not found | Fortified Elite Care";
    return () => {
      document.title = previous;
    };
  }, []);
  return (
    <div className="not-found-page">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <PublicHeader signedIn={signedIn} />
      <main id="main-content" className="wrap not-found-main">
        <div className="not-found-art" aria-hidden="true">
          <span className="not-found-orbit" />
          <div className="not-found-door">
            <DoorOpen strokeWidth={1.2} />
          </div>
          <span className="not-found-number">404</span>
          <span className="not-found-spark">+</span>
        </div>
        <div className="not-found-copy">
          <p className="eyebrow">PAGE NOT FOUND · 404</p>
          <h1>
            Let’s get you
            <br />
            back to care.
          </h1>
          <p className="not-found-description">
            We couldn’t find this page. The link may have changed, or the
            address may be incomplete.
          </p>
          <div className="actions">
            <Link className="button primary" to={siteHref("public", "/")}>
              <Home size={18} aria-hidden="true" /> Back to home
            </Link>
            <Link
              className="button outline"
              to={siteHref("public", "/contact")}
            >
              <LifeBuoy size={18} aria-hidden="true" /> Contact our team
            </Link>
          </div>
          <div className="not-found-shortcuts">
            <p className="muted">Looking for something in particular?</p>
            <Link to={siteHref("public", "/how-it-works")}>
              How care works <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link to={siteHref("dashboard", signedIn ? "/portal" : "/login")}>
              {signedIn ? "Open your portal" : "Sign in to your portal"}{" "}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
