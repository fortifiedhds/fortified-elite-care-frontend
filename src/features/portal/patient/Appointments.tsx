import { Link } from "react-router-dom";
import type { Dashboard } from "../../../shared/api/client";
import { dateLabel } from "../../../shared/lib/dates";
import { Empty } from "../../../shared/ui/Feedback";
import { TextLink } from "../../../shared/ui/TextLink";
import { Panel } from "../components/Panel";
import { VisitRow } from "../components/VisitRow";
import { portalPath } from "../navigation";

export function PatientVisitList({
  data,
  history = false,
}: {
  data: Dashboard;
  history?: boolean;
}) {
  const visits = data.visits
    .filter((visit) =>
      history
        ? visit.status === "COMPLETED" || visit.date < data.serviceToday
        : visit.status !== "COMPLETED" && visit.date >= data.serviceToday,
    )
    .sort((a, b) =>
      history ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
    );
  return (
    <Panel
      title={history ? "Previous visits" : "Upcoming appointments"}
      detail={
        history
          ? "See previous visits and find released summaries."
          : "See scheduled visits and requests awaiting a doctor."
      }
    >
      {visits.length ? (
        visits.map((visit) => (
          <VisitRow visit={visit} key={visit.id}>
            <TextLink to={portalPath("appointments/" + visit.id)}>
              View visit details
            </TextLink>
          </VisitRow>
        ))
      ) : (
        <Empty title={history ? "No past visits" : "No upcoming visits"}>
          {history
            ? "Your previous visits will appear here."
            : "Visit requests and confirmed appointments will appear here."}
        </Empty>
      )}
    </Panel>
  );
}

export function PatientVisitDetail({
  data,
  id,
}: {
  data: Dashboard;
  id: string;
}) {
  const visit = data.visits.find((entry) => entry.id === id);
  if (!visit)
    return (
      <Panel
        title="Visit unavailable"
        detail="This visit is not available in your account."
      >
        <TextLink to="/portal/appointments">Back to appointments</TextLink>
      </Panel>
    );
  return (
    <div className="stack">
      <Panel
        title={dateLabel(visit.date)}
        detail={
          visit.extra ? "Additional checkup" : "Routine monthly home checkup"
        }
      >
        <VisitRow visit={visit} />
        <p className="muted">
          A preference change does not move a confirmed appointment.
        </p>
        <Link className="button outline" to="/contact">
          Get scheduling help
        </Link>
      </Panel>
      {visit.summary && (
        <Panel title="Released visit summary">
          <p className="preserve">{visit.summary}</p>
        </Panel>
      )}
    </div>
  );
}

export function PatientSummaries({ data }: { data: Dashboard }) {
  const released = data.visits.filter((visit) => visit.summary);
  return (
    <Panel
      title="Released summaries"
      detail="Summaries appear here after the care team reviews them."
    >
      {released.length ? (
        <div className="stack">
          {released.map((visit) => (
            <VisitRow visit={visit} key={visit.id}>
              <p className="preserve">{visit.summary}</p>
            </VisitRow>
          ))}
        </div>
      ) : (
        <Empty title="No summaries yet">
          Your approved visit summaries will appear here.
        </Empty>
      )}
    </Panel>
  );
}
