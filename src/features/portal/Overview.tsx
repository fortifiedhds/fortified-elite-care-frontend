import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Users,
} from "lucide-react";
import type { Dashboard } from "../../shared/api/client";
import { apiBase } from "../../shared/api/client";
import { dateLabel } from "../../shared/lib/dates";
import { ordinal } from "../../shared/lib/monthly-schedule";
import { TextLink } from "../../shared/ui/TextLink";
import { PatientFormsPanel } from "../care-forms/patient/PatientForm";
import { Panel } from "./components/Panel";
import { VisitRow } from "./components/VisitRow";
import { usePortalPath, roleNames } from "./navigation";
import { canAdmin } from "./permissions";

export function Overview({ data }: { data: Dashboard }) {
  const portalPath = usePortalPath();
  const role = data.account.role;
  const nextVisit =
    role === "ADMIN"
      ? undefined
      : data.visits
          .filter((v) => v.status === "ASSIGNED" && v.date >= data.serviceToday)
          .sort((a, b) => a.date.localeCompare(b.date))[0];
  const summaries = data.visits.filter((visit) => visit.summary).length;
  const unread = data.notifications.filter((item) => !item.read).length;
  const metrics =
    role === "ADMIN"
      ? [
          {
            label: "Awaiting approval",
            value: data.enrolments.filter(
              (account) => account.reviewStatus === "PENDING",
            ).length,
            path: "enrolments",
            icon: Users,
          },
          {
            label: "Visits to manage",
            value: data.visits.length,
            path: "visits",
            icon: CalendarDays,
          },
          {
            label: "Extra requests in review",
            value: data.support.filter((request) => !request.approved).length,
            path: "extra-requests",
            icon: ClipboardCheck,
          },
        ]
      : role === "DOCTOR"
        ? [
            {
              label: "Available requests",
              value: data.available.length,
              path: "available",
              icon: CalendarDays,
            },
            {
              label: "Assigned visits",
              value: data.visits.filter((visit) => visit.status === "ASSIGNED")
                .length,
              path: "assigned",
              icon: ClipboardCheck,
            },
            {
              label: "Unread updates",
              value: unread,
              path: "notifications",
              icon: Bell,
            },
          ]
        : [
            {
              label: "Checkups",
              value: data.visits.length,
              path: "checkups",
              icon: CalendarDays,
            },
            {
              label: "Released summaries",
              value: summaries,
              path: "summaries",
              icon: FileText,
            },
            {
              label: "Unread updates",
              value: unread,
              path: "notifications",
              icon: Bell,
            },
          ];

  return (
    <div className="stack">
      <section className="portal-welcome">
        <p className="eyebrow">{roleNames[role].toUpperCase()}</p>
        <h2>Welcome, {data.account.name}</h2>
        <p>
          {data.account.reviewStatus === "PENDING"
            ? role === "DOCTOR" && !data.credentialsSubmitted
              ? "Upload both medical certificates to complete your application."
              : "Your enrolment is awaiting care team review."
            : role === "ADMIN"
              ? "Review enrolments, coordinate home visits, and manage exceptions."
              : role === "DOCTOR"
                ? "Find eligible home visits and document your completed checkups."
                : "Manage your routine checkups and see updates from the care team."}
        </p>
        {data.preferredDayOfMonth && (
          <span className="portal-preference">
            <CalendarDays size={17} aria-hidden="true" /> Preferred visit day:{" "}
            {ordinal(data.preferredDayOfMonth)} of every month
          </span>
        )}
      </section>
      {role === "DOCTOR" &&
        data.account.reviewStatus === "PENDING" &&
        !data.credentialsSubmitted && (
          <Panel
            title="Complete your doctor application"
            detail="Your university medical certificate and MDCN Certificate of Registration are required."
          >
            <TextLink to={portalPath("credentials")}>
              Upload your certificates
            </TextLink>
          </Panel>
        )}
      {nextVisit && (
        <Panel
          title="Your next assigned visit"
          detail={dateLabel(nextVisit.date)}
        >
          <VisitRow visit={nextVisit}>
            <TextLink
              to={portalPath(
                (role === "DOCTOR" ? "assigned/" : "appointments/") +
                  nextVisit.id,
              )}
            >
              View visit details
            </TextLink>
          </VisitRow>
        </Panel>
      )}
      {role === "PATIENT" && <PatientFormsPanel />}
      <div className="three-columns">
        {metrics
          .filter(
            (metric) =>
              role !== "ADMIN" ||
              (metric.path === "enrolments" &&
                canAdmin(data.account, "ENROLMENTS_MANAGE")) ||
              (metric.path === "visits" &&
                (canAdmin(data.account, "VISITS_MANAGE") ||
                  canAdmin(data.account, "SUMMARIES_PUBLISH"))) ||
              (metric.path === "extra-requests" &&
                canAdmin(data.account, "EXTRA_VISITS_MANAGE")),
          )
          .map(({ label, value, path, icon: Icon }) => (
            <article className="metric" key={label}>
              <span className="icon-box">
                <Icon size={22} aria-hidden="true" />
              </span>
              <strong>{value}</strong>
              <TextLink to={portalPath(path)}>{label}</TextLink>
            </article>
          ))}
      </div>
      {role === "DOCTOR" && data.account.reviewStatus === "APPROVED" && (
        <Panel
          title="Medical officer welcome pack"
          detail="Read the welcome letter and learn more about Fortified HDS and Elite Care."
        >
          <a
            className="button outline small"
            href={apiBase + "/resources/medical-officer-welcome"}
          >
            <FileText size={17} aria-hidden="true" /> Download welcome pack
            (PDF)
          </a>
        </Panel>
      )}
    </div>
  );
}
