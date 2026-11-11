import type { FormEvent } from "react";
import { useCallback, useState } from "react";
import {
  api,
  pathParams as idParams,
  messageFor,
  readResponse,
} from "../../../shared/api/client";
import { ErrorMessage } from "../../../shared/ui/Feedback";
import { Fields, Loading, Summary } from "../components/FormFields";
import { useDefinition, useLoad } from "../hooks/useFormResource";
import type { Answers, Schemas } from "../types";

export function ConsultationFields({
  value,
  update,
  disabled,
}: {
  value: Answers;
  update: (value: Answers) => void;
  disabled?: boolean;
}) {
  const definition = useDefinition("CONSULTATION");
  return (
    <details>
      <summary>Consultation note sections</summary>
      {definition.data ? (
        <div className="stack">
          {definition.data.sections.map((section) => (
            <fieldset className="panel" key={section.title} disabled={disabled}>
              <legend>{section.title}</legend>
              <p className="muted">{section.description}</p>
              <Fields
                fields={section.fields}
                answers={value}
                disabled={disabled}
                update={(id, answer) => update({ ...value, [id]: answer })}
              />
            </fieldset>
          ))}
        </div>
      ) : (
        <Loading error={definition.error} retry={definition.reload} />
      )}
    </details>
  );
}

export function SignedNoteDetails({
  id,
  structured,
}: {
  id: string;
  structured?: Answers;
}) {
  const definition = useDefinition("CONSULTATION");
  const results = useLoad(
    useCallback(
      async (signal) =>
        readResponse(
          await api.GET("/visits/{id}/addenda", { ...idParams(id), signal }),
        ),
      [id],
    ),
  );
  const [created, setCreated] = useState<Schemas["AddendumView"][]>([]);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function sign(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirm) {
      setConfirm(true);
      return;
    }
    const form = e.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const saved = readResponse(
        await api.POST("/visits/{id}/addenda", {
          ...idParams(id),
          body: {
            correction: String(data.get("correction")),
            reason: String(data.get("reason")),
          },
        }),
      );
      setCreated((old) => [...old, saved]);
      form.reset();
      setConfirm(false);
    } catch (e) {
      setError(messageFor(e));
    } finally {
      setBusy(false);
    }
  }
  const all = [...(results.data ?? []), ...created].filter(
    (x, i, a) => a.findIndex((y) => y.id === x.id) === i,
  );
  return (
    <div className="stack">
      {structured && Object.keys(structured).length > 0 && (
        <details>
          <summary>Structured consultation record</summary>
          <Summary answers={structured} definition={definition.data} />
        </details>
      )}
      <details>
        <summary>Signed addenda</summary>
        {results.data ? (
          all.length ? (
            all.map((item) => (
              <div className="record stack" key={item.id}>
                <strong>
                  Signed {new Date(item.signedAt).toLocaleString("en-NG")}
                </strong>
                <p className="preserve">{item.correction}</p>
                <p className="muted preserve">Reason: {item.reason}</p>
              </div>
            ))
          ) : (
            <p>No addenda yet.</p>
          )
        ) : (
          <Loading error={results.error} retry={results.reload} />
        )}
        <form className="stack" onSubmit={sign}>
          <p>
            Corrections are attached to this note. The signed original and any
            released summary stay unchanged.
          </p>
          <label>
            Correction
            <textarea
              name="correction"
              required
              minLength={5}
              maxLength={3000}
              rows={3}
              disabled={busy}
              onChange={() => setConfirm(false)}
            />
          </label>
          <label>
            Reason
            <textarea
              name="reason"
              required
              minLength={5}
              maxLength={500}
              rows={2}
              disabled={busy}
              onChange={() => setConfirm(false)}
            />
          </label>
          <ErrorMessage>{error}</ErrorMessage>
          {confirm && (
            <p className="feedback" role="status">
              Signing makes this addendum read only.
            </p>
          )}
          <div className="actions">
            <button className="button primary small" disabled={busy}>
              {busy
                ? "Signing…"
                : confirm
                  ? "Confirm addendum signature"
                  : "Review addendum"}
            </button>
            {confirm && (
              <button
                className="button outline small"
                type="button"
                onClick={() => setConfirm(false)}
              >
                Keep editing
              </button>
            )}
          </div>
        </form>
      </details>
    </div>
  );
}
