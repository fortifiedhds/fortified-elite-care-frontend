import { useCallback } from "react";
import {
  api,
  pathParams as idParams,
  readResponse,
} from "../../../shared/api/client";
import { DraftWizard } from "../components/DraftWizard";
import { Loading, Summary } from "../components/FormFields";
import {
  useDefinition,
  useDefinitionForDoctor,
  useLoad,
} from "../hooks/useFormResource";

export function ClinicianBaseline({ id }: { id: string }) {
  const definition = useDefinition("BASELINE_CLINICIAN");
  const selfDefinition = useDefinitionForDoctor();
  const record = useLoad(
    useCallback(
      async (signal) =>
        readResponse(
          await api.GET("/visits/{id}/baseline", { ...idParams(id), signal }),
        ),
      [id],
    ),
  );
  if (!definition.data || !record.data)
    return (
      <Loading
        error={definition.error || record.error}
        retry={() => {
          definition.reload();
          record.reload();
        }}
      />
    );
  return (
    <div className="stack">
      {record.data.selfReport && (
        <details className="panel">
          <summary>Submitted patient self-report</summary>
          <Summary
            answers={record.data.selfReport.answers}
            definition={selfDefinition.data}
          />
        </details>
      )}
      <DraftWizard
        definition={definition.data}
        initial={record.data}
        exit="/portal/assigned"
        onSave={async (body) =>
          readResponse(
            await api.PATCH("/visits/{id}/baseline", { ...idParams(id), body }),
          )
        }
        description="Record clinician observations and a care plan for this assigned visit. Patient responses are separate."
        submitLabel="Complete baseline assessment"
      />
    </div>
  );
}
