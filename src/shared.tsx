import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, HeartPulse } from "lucide-react";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      className={`brand ${light ? "brand-light" : ""}`}
      to="/"
      aria-label="Fortified Elite Care home"
    >
      <span className="brand-mark">
        <HeartPulse size={23} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span>
        <strong>Fortified Elite Care</strong>
        <small>BY FORTIFIED HDS</small>
      </span>
    </Link>
  );
}

export function ErrorMessage({ children }: { children?: string }) {
  return (
    children && (
      <p className="feedback error" role="alert">
        {children}
      </p>
    )
  );
}

export function Empty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="icon-box">
        <CalendarDays size={21} aria-hidden="true" />
      </span>
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}

export function TextLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link className="text-link" to={to}>
      {children}
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}

export function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date + "T12:00:00Z"));
}
