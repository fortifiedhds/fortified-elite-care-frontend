import type { FormEvent } from "react";
import { useCallback, useState } from "react";
import {
  api,
  pathParams as idParams,
  messageFor,
  readResponse,
} from "../../../shared/api/client";
import { ErrorMessage } from "../../../shared/ui/Feedback";
import { Loading, Summary } from "../components/FormFields";
import { useDefinition, useLoad } from "../hooks/useFormResource";
import type { Registration } from "../types";

export function RegistrationReview({ id }: { id: string }) {
  const definition = useDefinition("REGISTRATION");
  const result = useLoad(
    useCallback(
      async (signal) =>
        readResponse(
          await api.GET("/admin/registrations/{id}", {
            ...idParams(id),
            signal,
          }),
        ),
      [id],
    ),
  );
  if (!result.data)
    return <Loading error={result.error} retry={result.reload} />;
  return (
    <div className="form-shell">
      <section className="panel">
        <h2>Submitted registration</h2>
        <Summary answers={result.data.answers} definition={definition.data} />
      </section>
      <ReviewEditor id={id} initial={result.data} />
    </div>
  );
}

function ReviewEditor({ id, initial }: { id: string; initial: Registration }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const choice = String(form.get("requestedPackage") ?? "");
    const requestedPackage =
      choice === "Silver" || choice === "Gold" || choice === "Platinum"
        ? choice
        : undefined;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      readResponse(
        await api.PATCH("/admin/registrations/{id}", {
          ...idParams(id),
          body: {
            clientNumber: String(form.get("clientNumber")),
            requestedPackage,
          },
        }),
      );
      setSaved(true);
    } catch (e) {
      setError(messageFor(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>Official use</h2>
      <p>
        Assign a client number and record the package under discussion. This
        does not activate a package or collect payment.
      </p>
      {initial.reviewer && initial.reviewedAt && (
        <p className="muted">
          Reviewed by {initial.reviewer} on{" "}
          {new Date(initial.reviewedAt).toLocaleDateString("en-NG")}.
        </p>
      )}
      <form className="stack" onSubmit={submit}>
        <label>
          Client number
          <input
            name="clientNumber"
            defaultValue={initial.clientNumber}
            required
            minLength={2}
            maxLength={40}
            pattern="[A-Za-z0-9\-]+"
          />
        </label>
        <label>
          Requested package
          <select
            name="requestedPackage"
            defaultValue={initial.requestedPackage ?? ""}
          >
            <option value="">Not decided</option>
            <option>Silver</option>
            <option>Gold</option>
            <option>Platinum</option>
          </select>
        </label>
        <ErrorMessage>{error}</ErrorMessage>
        {saved && (
          <p className="feedback success" role="status">
            Review recorded.
          </p>
        )}
        <button className="button primary" disabled={busy}>
          {busy ? "Saving…" : "Save review"}
        </button>
      </form>
    </section>
  );
}
