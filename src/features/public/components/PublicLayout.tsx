import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Brand } from "../../../shared/ui/Brand";

export function PublicHeader({ signedIn }: { signedIn: boolean }) {
  const [menu, setMenu] = useState(false);
  return (
    <header className="public-header">
      <div className="wrap header-inner">
        <Brand />
        <button
          className="button outline icon mobile-menu"
          type="button"
          aria-label={menu ? "Close navigation" : "Open navigation"}
          aria-expanded={menu}
          aria-controls="public-navigation"
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <nav
          className={"public-nav" + (menu ? " open" : "")}
          id="public-navigation"
          aria-label="Main navigation"
          onClick={() => setMenu(false)}
        >
          <div className="public-nav-links">
            <NavLink to="/how-it-works">How it works</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/services">Services</NavLink>
            <NavLink to="/for-families">For families</NavLink>
            <NavLink to="/for-doctors">For doctors</NavLink>
          </div>
          <div className="public-nav-actions">
            <Link
              className="button outline"
              to={signedIn ? "/portal" : "/login"}
            >
              {signedIn ? "My portal" : "Sign in"}
            </Link>
            <Link to="/for-families" className="button primary">
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
            Routine home healthcare for older adults and the people who support
            them.
          </p>
        </div>
        <nav aria-label="Explore">
          <strong>Explore</strong>
          <Link to="/about">About</Link>
          <Link to="/services#packages">Compare packages</Link>
          <Link to="/contact">Contact</Link>
        </nav>
        <nav aria-label="Policies">
          <strong>Useful information</strong>
          <Link to="/privacy">Privacy and confidentiality</Link>
          <Link to="/terms">Terms and service agreement</Link>
          <Link to="/for-doctors">For doctors</Link>
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
