import { CalendarDays } from "lucide-react";
import type { ReactNode } from "react";
import type { Visit } from "../../../shared/api/client";
import { dateLabel } from "../../../shared/lib/dates";

const statusLabels = {
  AVAILABLE: "Awaiting doctor",
  ASSIGNED: "Assigned",
  COMPLETED: "Completed",
};

export function VisitRow({
  visit,
  children,
}: {
  visit: Visit;
  children?: ReactNode;
}) {
  return (
    <article className="record">
      <div className="record-heading">
        <span className="icon-box">
          <CalendarDays size={20} aria-hidden="true" />
        </span>
        <div>
          <h3>{visit.patientName ?? dateLabel(visit.date)}</h3>
          <p>
            {visit.patientName ? `${dateLabel(visit.date)} · ` : ""}
            {visit.area}
            {visit.extra && " · Extra visit"}
            {visit.doctorName && ` · ${visit.doctorName}`}
          </p>
        </div>
        <span className={`status ${visit.status.toLowerCase()}`}>
          {statusLabels[visit.status]}
        </span>
      </div>
      {children && <div className="record-body">{children}</div>}
    </article>
  );
}
