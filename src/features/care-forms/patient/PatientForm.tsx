import { FileText, Heart, ShieldCheck } from "lucide-react";
import { useCallback } from "react";
import { Link } from "react-router-dom";
import type { Account } from "../../../shared/api/client";
import { api, readResponse } from "../../../shared/api/client";
import { Empty } from "../../../shared/ui/Feedback";
import { DraftWizard } from "../components/DraftWizard";
import { Loading } from "../components/FormFields";
import { useDefinition, useLoad } from "../hooks/useFormResource";

export function PatientForm({
  kind,
  account,
}: {
  kind: "REGISTRATION" | "BASELINE_SELF";
  account: Account;
}) {
  const definition = useDefinition(kind);
  const record = useLoad(
    useCallback(
      async (signal) =>
        readResponse(
          await api.GET("/patients/forms/{kind}", {
            params: { path: { kind } },
            signal,
          }),
        ),
      [kind],
    ),
  );
  if (kind === "BASELINE_SELF" && account.reviewStatus !== "APPROVED")
    return (
      <div className="panel">
        <Empty title="Your enrolment is awaiting review">
          Once approved, you can complete this assessment or ask your doctor to
          help during your first visit.
        </Empty>
      </div>
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
  const initial =
    kind === "REGISTRATION" && record.data.revision === 0
      ? { ...record.data, answers: { "email-address": account.email } }
      : record.data;
  return (
    <DraftWizard
      definition={definition.data}
      initial={initial}
      onSave={async (body) =>
        readResponse(
          await api.PATCH("/patients/forms/{kind}", {
            params: { path: { kind } },
            body,
          }),
        )
      }
      exit="/portal"
      description={
        kind === "REGISTRATION"
          ? "You can pause and come back. Sponsorship and report preferences do not grant anyone access."
          : "Tell your doctor how you are doing. Your doctor records home observations and clinical findings separately."
      }
      submitLabel={
        kind === "REGISTRATION"
          ? "Send for review"
          : "Share with your care team"
      }
      aside={
        kind === "REGISTRATION" ? (
          <p className="muted">
            First name, surname and email are needed for review. You can update
            care permissions separately.
          </p>
        ) : (
          <Link to="/contact">Ask for help</Link>
        )
      }
    />
  );
}

export function PatientFormsPanel() {
  return (
    <div className="three-columns">
      {[
        {
          path: "registration",
          label: "Registration",
          detail: "Complete your enrolment details.",
          Icon: FileText,
        },
        {
          path: "baseline",
          label: "Baseline assessment",
          detail: "Tell your doctor how you’re doing.",
          Icon: Heart,
        },
        {
          path: "consent",
          label: "Care permissions",
          detail: "Review and update your choices.",
          Icon: ShieldCheck,
        },
      ].map(({ path, label, detail, Icon }) => (
        <article className="panel" key={path}>
          <span className="icon-box">
            <Icon size={20} aria-hidden="true" />
          </span>
          <h3>{label}</h3>
          <p className="muted">{detail}</p>
          <Link to={"/portal/" + path} className="button outline small">
            Open form
          </Link>
        </article>
      ))}
    </div>
  );
}
