import type { FormEvent } from "react";
import { useState } from "react";
import type { NoteInput, Visit } from "../../../shared/api/client";
import { api, pathParams, readResponse } from "../../../shared/api/client";
import { ErrorMessage } from "../../../shared/ui/Feedback";
import { ConsultationFields } from "../../care-forms/doctor/Consultation";
import type { Action } from "../types";

export function NoteForm({
  visit,
  act,
  busy,
}: {
  visit: Visit;
  act: Action;
  busy: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [validation, setValidation] = useState("");
  const [structured, setStructured] = useState<
    NonNullable<NoteInput["structured"]>
  >(visit.structured ?? {});

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidation("");
    const form = new FormData(event.currentTarget);
    const body: NoteInput = {
      observations: String(form.get("observations") ?? ""),
      summary: String(form.get("summary") ?? ""),
      structured,
    };
    if (confirming) {
      if (!body.observations.trim() || !body.summary.trim()) {
        setValidation("Enter observations and a summary before signing.");
        return;
      }
      void act(
        async () =>
          readResponse(
            await api.POST("/visits/{id}/sign", {
              ...pathParams(visit.id),
              body,
            }),
          ),
        "Note signed and visit completed.",
      );
    } else {
      void act(
        async () =>
          readResponse(
            await api.PATCH("/visits/{id}/note", {
              ...pathParams(visit.id),
              body,
            }),
          ),
        "Draft saved.",
      );
    }
  }

  return (
    <form
      className="stack"
      onSubmit={submit}
      onChange={() => setConfirming(false)}
    >
      <ConsultationFields
        value={structured}
        update={setStructured}
        disabled={busy}
      />
      <label>
        Private observations
        <textarea
          name="observations"
          rows={3}
          maxLength={5000}
          defaultValue={visit.observations}
        />
      </label>
      <label>
        Patient summary
        <textarea
          name="summary"
          rows={3}
          maxLength={2000}
          defaultValue={visit.summary}
        />
      </label>
      <ErrorMessage>{validation}</ErrorMessage>
      {confirming && (
        <p className="feedback" role="status">
          Signing locks the note and marks the visit as complete.
        </p>
      )}
      <div className="actions">
        {confirming ? (
          <button
            type="button"
            className="button outline small"
            disabled={busy}
            onClick={() => setConfirming(false)}
          >
            Keep editing
          </button>
        ) : (
          <button
            className="button outline small"
            disabled={busy}
            value="draft"
          >
            Save draft
          </button>
        )}
        {confirming ? (
          <button className="button primary small" disabled={busy}>
            Confirm signature
          </button>
        ) : (
          <button
            type="button"
            className="button primary small"
            disabled={busy}
            onClick={() => setConfirming(true)}
          >
            Sign and complete visit
          </button>
        )}
      </div>
    </form>
  );
}
