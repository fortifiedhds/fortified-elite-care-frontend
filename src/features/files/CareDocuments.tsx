import { ArrowRight, Download, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { apiBase } from "../../shared/api/client";
import type { Account } from "../../shared/api/client";

export function CareDocuments({ account }: { account: Account }) {
  const patient = account.role === "PATIENT";
  const approved = account.reviewStatus === "APPROVED";
  const records = patient
    ? [
        {
          title: "Client registration",
          detail: "Complete or review your registration in the enrolment form.",
          path: "registration",
        },
        {
          title: "Baseline health assessment",
          detail:
            "Complete your self-report. Your assigned clinician records their assessment separately.",
          path: "baseline",
          restricted: !approved,
        },
        {
          title: "Care permissions",
          detail:
            "Review or update your recorded consent choices and authorised contacts.",
          path: "consent",
        },
        {
          title: "Service agreement",
          detail:
            "Review the agreement information. Online signing is not available yet.",
          path: "agreement",
        },
        {
          title: "Released visit summaries",
          detail: "Read summaries approved for release by the care team.",
          path: "summaries",
        },
      ]
    : [
        {
          title: "Medical certificates",
          detail:
            "Submit and download your university medical certificate and MDCN Certificate of Registration.",
          path: "credentials",
        },
        {
          title: "Consultation notes and assessments",
          detail:
            "Open an assigned visit to complete, save and sign its digital consultation note or baseline assessment.",
          path: "assigned",
          restricted: !approved,
        },
      ];
  return (
    <section className="panel stack">
      <h2>{patient ? "Your care records" : "Clinical forms and resources"}</h2>
      <p>
        {patient
          ? "Your forms and records are completed in the portal. You do not need to download and upload them again."
          : "Complete consultation notes directly in your assigned visits. Signed notes support addenda for later corrections."}
      </p>
      <div className="stack">
        {records.map((record) => (
          <article className="record stack" key={record.path}>
            <h3>
              <FileText size={18} aria-hidden="true" /> {record.title}
            </h3>
            <p className="muted">{record.detail}</p>
            {record.restricted ? (
              <p className="muted">
                Available after your enrolment is approved.
              </p>
            ) : (
              <Link
                className="button outline small"
                to={"/portal/" + record.path}
              >
                Open {record.title.toLowerCase()}{" "}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
          </article>
        ))}
        {!patient && (
          <article className="record stack">
            <h3>Medical officer welcome pack</h3>
            <p className="muted">
              Download the reference PDF with the welcome letter and company
              information.
            </p>
            {approved ? (
              <a
                className="button outline small"
                href={apiBase + "/resources/medical-officer-welcome"}
              >
                <Download size={16} aria-hidden="true" /> Download welcome pack
                (PDF)
              </a>
            ) : (
              <p className="muted">
                Available after your application is approved.
              </p>
            )}
          </article>
        )}
      </div>
    </section>
  );
}
