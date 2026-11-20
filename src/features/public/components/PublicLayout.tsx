import { ArrowRight, Menu, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { Brand } from "../../../shared/ui/Brand";
import { siteHref } from "../../../shared/lib/sites";
import { useMobileMenu } from "../../../shared/hooks/useMobileMenu";

export function PublicHeader({ signedIn }: { signedIn: boolean }) {
  const {
    open: menu,
    mobile,
    toggle,
    close,
    shellRef,
    panelRef,
    toggleRef,
  } = useMobileMenu(1050);
  return (
    <header className="public-header public-site-header" ref={shellRef}>
      <div className="wrap header-inner">
        <Brand />
        <button
          className="menu-toggle mobile-menu"
          ref={toggleRef}
          type="button"
          aria-label={menu ? "Close navigation" : "Open navigation"}
          aria-expanded={menu}
          aria-controls="public-navigation"
          onClick={toggle}
        >
          {menu ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <nav
          className={"public-nav" + (menu ? " open" : "")}
          id="public-navigation"
          ref={panelRef}
          aria-label="Main navigation"
          aria-hidden={mobile && !menu ? true : undefined}
          inert={mobile && !menu ? true : undefined}
          onClick={(event) => {
            if (
              event.target instanceof Element &&
              event.target.closest("a[href]")
            )
              close();
          }}
        >
          <div className="public-nav-links">
            <NavLink to={siteHref("public", "/how-it-works")}>
              How it works
            </NavLink>
            <NavLink to={siteHref("public", "/about")}>About</NavLink>
            <NavLink to={siteHref("public", "/services")}>Services</NavLink>
            <NavLink to={siteHref("public", "/for-families")}>
              For families
            </NavLink>
            <NavLink to={siteHref("public", "/for-doctors")}>
              For doctors
            </NavLink>
          </div>
          <div className="public-nav-actions">
            <Link
              className="button outline"
              to={siteHref("dashboard", signedIn ? "/portal" : "/login")}
            >
              {signedIn ? "My portal" : "Sign in"}
            </Link>
            <Link
              to={siteHref("public", "/for-families")}
              className="button primary"
            >
              Explore care <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="public-footer">
      <div className="wrap footer-grid">
        <div>
          <Brand light />
          <p>
            Routine home healthcare for adults and the people who support them.
          </p>
        </div>
        <nav aria-label="Explore">
          <strong>Explore</strong>
          <Link to={siteHref("public", "/about")}>About</Link>
          <Link to={siteHref("public", "/services#packages")}>
            Compare packages
          </Link>
          <Link to={siteHref("public", "/contact")}>Contact</Link>
        </nav>
        <nav aria-label="Policies">
          <strong>Useful information</strong>
          <Link to={siteHref("public", "/privacy")}>
            Privacy and confidentiality
          </Link>
          <Link to={siteHref("public", "/terms")}>
            Terms and service agreement
          </Link>
          <Link to={siteHref("public", "/for-doctors")}>For doctors</Link>
        </nav>
      </div>
      <div className="wrap footer-base">
        <span>© Copyright 2026 Fortified Elite Care. All rights reserved.</span>
        <span>
          Routine care only. For emergencies, seek immediate medical care.
        </span>
      </div>
    </footer>
  );
}
