import { Link } from "react-router-dom";
import type { Dashboard } from "../../../shared/api/client";
import { Empty } from "../../../shared/ui/Feedback";
import { TextLink } from "../../../shared/ui/TextLink";
import { SignedNoteDetails } from "../../care-forms/doctor/Consultation";
import { Panel } from "../components/Panel";
import { VisitRow } from "../components/VisitRow";
import { portalPath } from "../navigation";
import type { Action } from "../types";
import { NoteForm } from "./NoteForm";

export function AssignedVisits({ data }: { data: Dashboard }) {
  return (
    <Panel
      title="Your assigned visits"
      detail="Document the visit on or after the scheduled date."
    >
      {data.visits.length ? (
        <div className="stack">
          {data.visits.map((visit) => (
            <VisitRow visit={visit} key={visit.id}>
              <TextLink to={portalPath("assigned/" + visit.id)}>
                Open visit
              </TextLink>
            </VisitRow>
          ))}
        </div>
      ) : (
        <Empty title="No assigned visits">
          Visits you claim or receive from the care team will appear here.
        </Empty>
      )}
    </Panel>
  );
}

export function AssignedVisitDetail({
  data,
  id,
  act,
  busy,
}: {
  data: Dashboard;
  id: string;
  act: Action;
  busy: boolean;
}) {
  const visit = data.visits.find((entry) => entry.id === id);
  return (
    <div className="stack">
      <TextLink to="/portal/assigned">Back to assigned visits</TextLink>
      {!visit ? (
        <Panel
          title="Visit unavailable"
          detail="This visit is not assigned to your account."
        />
      ) : (
        <>
          <VisitRow visit={visit}>
            {visit.date <= data.serviceToday ? (
              <Link
                className="button outline small"
                to={portalPath("assigned/" + visit.id + "/baseline")}
              >
                Baseline assessment
              </Link>
            ) : (
              <p className="muted">Documentation opens on the visit date.</p>
            )}
          </VisitRow>
          {visit.hasSignedNote ? (
            <Panel
              title="Signed consultation note"
              detail={
                visit.published
                  ? "Summary released"
                  : "Awaiting clinical review"
              }
            >
              <p className="preserve">{visit.summary}</p>
              <details>
                <summary>Private observations</summary>
                <p className="preserve">{visit.observations}</p>
              </details>
              <SignedNoteDetails id={visit.id} structured={visit.structured} />
            </Panel>
          ) : (
            visit.date <= data.serviceToday && (
              <Panel title="Consultation note">
                <NoteForm visit={visit} act={act} busy={busy} />
              </Panel>
            )
          )}
        </>
      )}
    </div>
  );
}
