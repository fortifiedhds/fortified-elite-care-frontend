import type { ReactNode } from "react";

export function Panel({
  title,
  detail,
  children,
}: {
  title: string;
  detail?: string;
  children?: ReactNode;
}) {
  return (
    <section className="panel">
      <header>
        <h2>{title}</h2>
        {detail && <p>{detail}</p>}
      </header>
      {children}
    </section>
  );
}
