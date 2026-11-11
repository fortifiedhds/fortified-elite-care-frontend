import { ErrorMessage } from "../../../shared/ui/Feedback";
import type { Answers, Definition, Field } from "../types";

export function Fields({
  fields,
  answers,
  update,
  disabled,
}: {
  fields: Field[];
  answers: Answers;
  update: (id: string, answer: string | string[]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="form-grid">
      {fields.map((field) => {
        const stored = answers[field.id];
        const value = typeof stored === "string" ? stored : "";
        const selected = Array.isArray(stored) ? stored : [];
        if (field.type === "checks")
          return (
            <fieldset key={field.id} className="form-full" disabled={disabled}>
              <legend>{field.label}</legend>
              <div className="form-options">
                {field.options?.map((option) => (
                  <label className="form-choice" key={option}>
                    <input
                      type="checkbox"
                      checked={selected.includes(option)}
                      onChange={(e) =>
                        update(
                          field.id,
                          e.target.checked
                            ? [...selected, option]
                            : selected.filter((x) => x !== option),
                        )
                      }
                    />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>
          );
        return (
          <label
            key={field.id}
            className={field.type === "textarea" ? "form-full" : undefined}
          >
            {field.label}
            {field.type === "select" ? (
              <select
                disabled={disabled}
                value={value}
                onChange={(e) => update(field.id, e.target.value)}
              >
                <option value="">Choose an option</option>
                {field.options?.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea
                disabled={disabled}
                maxLength={2000}
                rows={3}
                value={value}
                onChange={(e) => update(field.id, e.target.value)}
              />
            ) : (
              <input
                type={field.type}
                disabled={disabled}
                value={value}
                onChange={(e) => update(field.id, e.target.value)}
                maxLength={
                  field.type === "date" || field.type === "number"
                    ? undefined
                    : 254
                }
                min={field.type === "number" ? 0 : undefined}
                max={field.type === "number" ? 1000 : undefined}
                step={field.type === "number" ? "any" : undefined}
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

export function Summary({
  answers,
  definition,
}: {
  answers: Answers;
  definition?: Definition;
}) {
  const fields = new Map(
    definition?.sections.flatMap((section) =>
      section.fields.map((field) => [field.id, field.label] as const),
    ),
  );
  const rows = Object.entries(answers).filter(([, v]) => v.length > 0);
  if (!rows.length) return <p className="muted">No answers yet.</p>;
  return (
    <dl>
      {rows.map(([key, val]) => (
        <div className="form-detail" key={key}>
          <dt>{fields.get(key) ?? key.replaceAll("-", " ")}</dt>
          <dd className="preserve">
            {Array.isArray(val) ? val.join(", ") : val}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Loading({
  error,
  retry,
}: {
  error?: string;
  retry: () => void;
}) {
  return error ? (
    <div className="panel">
      <ErrorMessage>{error}</ErrorMessage>
      <button className="button outline" onClick={retry}>
        Try again
      </button>
    </div>
  ) : (
    <p role="status">Loading your form…</p>
  );
}
