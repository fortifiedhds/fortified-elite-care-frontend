import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { questions, steps } from "../content";

export function Start({
  role = "patient",
  label = "Start patient enrolment",
  light = false,
}: {
  role?: "patient" | "doctor";
  label?: string;
  light?: boolean;
}) {
  return (
    <Link
      className={"button " + (light ? "peach" : "primary")}
      to={"/register?role=" + role}
    >
      {label}
      <ArrowRight size={18} aria-hidden="true" />
    </Link>
  );
}

export function Steps({ entries = steps }: { entries?: typeof steps }) {
  return (
    <div className="three-columns">
      {entries.map(({ icon: Icon, title, detail }, i) => (
        <article className="step" key={title}>
          <div className="step-top">
            <span className="icon-box">
              <Icon size={22} aria-hidden="true" />
            </span>
            <span className="step-number" aria-hidden="true">
              0{i + 1}
            </span>
          </div>
          <h3>{title}</h3>
          <p>{detail}</p>
        </article>
      ))}
    </div>
  );
}

export function FAQList({ brief = false }: { brief?: boolean }) {
  return (
    <div className="faq-list">
      {questions.slice(0, brief ? 3 : undefined).map(([q, a]) => (
        <details key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}

export function JoinBand() {
  return (
    <div className="join-band">
      <div className="stack">
        <p className="eyebrow">TAKE THE FIRST STEP</p>
        <h2>Let’s arrange your first visit.</h2>
        <p>Tell us a little about yourself and when you’d prefer to be seen.</p>
      </div>
      <Start light />
    </div>
  );
}
