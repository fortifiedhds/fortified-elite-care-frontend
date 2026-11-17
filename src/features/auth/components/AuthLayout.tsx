import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Brand } from "../../../shared/ui/Brand";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-shell">
      <aside className="auth-story">
        <img
          className="auth-story-photo"
          src="/home-visit-1400.jpg"
          srcSet="/home-visit-900.jpg 900w, /home-visit-1400.jpg 1400w, /home-visit-1800.jpg 1800w"
          sizes="(max-width: 800px) 1px, 45vw"
          alt=""
          width={1800}
          height={1200}
        />
        <Brand light />
        <div className="auth-story-copy">
          {/* <p className="eyebrow">FORTIFIED ELITE CARE</p> */}
          <h2>
            Good care <em>feels closer.</em>
          </h2>
          <p>One place to arrange home visits and see what comes next.</p>
        </div>
      </aside>
      <main className="auth-main page-enter" id="main-content">
        <section className="auth-card">
          <Link className="text-link auth-content-back" to="/">
            <ArrowLeft size={16} aria-hidden="true" /> Back to website
          </Link>
          <p className="eyebrow">YOUR ACCOUNT</p>
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
        </section>
      </main>
    </div>
  );
}
