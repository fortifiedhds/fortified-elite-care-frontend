import { ArrowRight, Check } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useMemoryDraft } from "../../session-security/draft-memory";
import { Link, useNavigate } from "react-router-dom";
import { messageFor } from "../../../shared/api/client";
import { ErrorMessage } from "../../../shared/ui/Feedback";
import type { Answers, Definition, DraftInput, RecordView } from "../types";
import { Fields, Summary } from "./FormFields";

export function DraftWizard({
  definition,
  initial,
  onSave,
  exit,
  description,
  submitLabel,
  aside,
}: {
  definition: Definition;
  initial: RecordView;
  onSave: (body: DraftInput) => Promise<RecordView>;
  exit: string;
  description: string;
  submitLabel: string;
  aside?: ReactNode;
}) {
  const navigate = useNavigate();
  const [record, setRecord] = useState(initial);
  const [answers, setAnswers] = useMemoryDraft<Answers>(
    initial.answers,
    record.revision,
    "wizard",
  );
  const [step, setStep] = useState(() => {
    if (!initial.revision) return 0;
    const last = definition.sections.reduce(
      (last, section, index) =>
        section.fields.some((field) =>
          Boolean(initial.answers[field.id]?.length),
        )
          ? index
          : last,
      -1,
    );
    return Math.max(0, Math.min(definition.sections.length - 1, last + 1));
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const section = definition.sections[step];
  const last = step + 1 === definition.sections.length;
  const locked = Boolean(record.submittedAt);

  function move(next: number) {
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }

  const autoSave = useRef(() => {});
  autoSave.current = () => {
    if (!locked && JSON.stringify(answers) !== JSON.stringify(record.answers))
      void save(false, false, true);
  };
  useEffect(() => {
    const saveDraft = () => autoSave.current();
    window.addEventListener("fec:session-warning", saveDraft);
    return () => window.removeEventListener("fec:session-warning", saveDraft);
  }, []);
  async function save(submit: boolean, leave: boolean, automatic = false) {
    if (busy || (!automatic && !form.current?.reportValidity())) return;
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const saved = await onSave({
        version: definition.version,
        revision: record.revision,
        answers,
        submit,
      });
      setRecord(saved);
      setAnswers(saved.answers);
      if (leave) navigate(exit);
      else setNotice(submit ? "Form submitted for review." : "Draft saved.");
    } catch (e) {
      setError(messageFor(e));
    } finally {
      setBusy(false);
    }
  }

  if (locked)
    return (
      <section className="panel">
        <div className="actions">
          <Check aria-hidden="true" size={18} />
          <strong>Submitted</strong>
        </div>
        <p>
          This form is read only. Contact the care team if a correction is
          needed.
        </p>
        <Summary answers={record.answers} definition={definition} />
        <Link to={exit} className="button outline">
          Back to workspace
        </Link>
      </section>
    );

  return (
    <div className="form-shell">
      <section className="panel">
        <div className="list-row">
          <strong>
            Step {step + 1} of {definition.sections.length}
          </strong>
          <span className="status available">Draft</span>
        </div>
        <progress
          aria-label="Form progress"
          className="form-progress"
          value={step + 1}
          max={definition.sections.length}
        />
        <h2 ref={heading} tabIndex={-1}>
          {section.title}
        </h2>
        <p className="muted">{section.description}</p>
        <form
          ref={form}
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (last) void save(true, false);
            else move(step + 1);
          }}
        >
          <div key={step} className="step-enter">
            <Fields
              fields={section.fields}
              answers={answers}
              disabled={busy}
              update={(id, value) =>
                setAnswers((old) => ({ ...old, [id]: value }))
              }
            />
          </div>
          {last && (
            <details>
              <summary>Review your answers</summary>
              <Summary answers={answers} definition={definition} />
            </details>
          )}
          <ErrorMessage>{error}</ErrorMessage>
          {notice && (
            <p className="feedback success" role="status">
              {notice}
            </p>
          )}
          <div className="actions">
            {step > 0 && (
              <button
                className="button outline"
                type="button"
                disabled={busy}
                onClick={() => move(step - 1)}
              >
                Back
              </button>
            )}
            <button
              type="button"
              className="button outline"
              disabled={busy}
              onClick={() => void save(false, true)}
            >
              Save and exit
            </button>
            <button type="submit" className="button primary" disabled={busy}>
              {busy ? "Saving…" : last ? submitLabel : "Continue"}
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        </form>
      </section>
      <aside className="panel">
        <h3>In this form</h3>
        <p>{description}</p>
        <ol className="form-steps">
          {definition.sections.map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                disabled={busy}
                aria-current={step === i ? "step" : undefined}
                onClick={() => move(i)}
              >
                {i + 1}. {s.title}
              </button>
            </li>
          ))}
        </ol>
        {aside}
      </aside>
    </div>
  );
}
