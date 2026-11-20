import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { careEmail } from "../../shared/lib/contact";
import { PackageCards } from "./PackageCards";

const intervals = [
  "Monthly",
  "Quarterly",
  "Every six months",
  "Annually",
] as const;

export function Billing() {
  const [selected, setSelected] =
    useState<(typeof intervals)[number]>("Monthly");
  return (
    <div className="stack">
      <section className="panel">
        <h2>Compare care packages</h2>
        <p>
          Request a quote for your preferred package and billing frequency.
          Online checkout is not available.
        </p>
        <div
          className="actions billing-tabs"
          role="group"
          aria-label="Billing frequency"
        >
          {intervals.map((interval) => (
            <button
              className="button outline small"
              key={interval}
              type="button"
              aria-pressed={interval === selected}
              onClick={() => setSelected(interval)}
            >
              {interval}
            </button>
          ))}
        </div>
        <p className="muted" aria-live="polite">
          {selected === "Every six months"
            ? "Ask the care team whether six-month billing is available for your agreement."
            : selected + " rates are available from the care team."}
        </p>
        <a
          className="button primary"
          href={
            "mailto:" +
            careEmail +
            "?subject=" +
            encodeURIComponent(selected + " care package quote")
          }
        >
          Request a quote <ArrowRight size={17} aria-hidden="true" />
        </a>
      </section>
      <PackageCards />
    </div>
  );
}
