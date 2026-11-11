import { CalendarDays } from "lucide-react";
import type { ReactNode } from "react";

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
