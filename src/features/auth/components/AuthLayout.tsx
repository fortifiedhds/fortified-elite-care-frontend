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
        <Brand light />
        <p className="eyebrow">FORTIFIED ELITE CARE</p>
        <h2>
          Good care <em>feels closer.</em>
        </h2>
        <p>One place to arrange home visits and see what comes next.</p>
        <img src="/home-visit.jpg" alt="" width={6000} height={4000} />
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
