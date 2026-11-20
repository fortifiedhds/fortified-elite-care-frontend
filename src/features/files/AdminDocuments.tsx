import { FileCheck2, FolderLock, RotateCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, readResponse } from "../../shared/api/client";
import type { Account } from "../../shared/api/client";
import type { components } from "../../shared/api/schema";
import { useLoad } from "../care-forms/hooks/useFormResource";
import { Loading } from "../care-forms/components/FormFields";
import { canAdmin } from "../portal/permissions";
import { usePortalPath } from "../portal/navigation";
import { Documents } from "./Documents";

type RecordView = components["schemas"]["AdminDocumentView"];
type DetailRecord = Omit<RecordView, "kind"> & {
  kind: "CARE_PERMISSIONS" | "CONSULTATION";
};
const choiceLabels: Record<string, string> = {
  healthAssessment: "Health assessments",
  homeVisits: "Home visits",
  sampleCollection: "Sample collection",
  education: "Health education and counselling",
  referrals: "Referrals",
  sharing: "Sharing with named contacts",
  emergencyContact: "Emergency contact and referral coordination",
};

export function AdminDocuments({ account }: { account: Account }) {
  const [tab, setTab] = useState<"submitted" | "private">("submitted");
  return (
    <div className="stack">
      <div
        className="actions document-tabs"
        role="group"
        aria-label="Document library"
      >
        <button
          className="button outline"
          aria-pressed={tab === "submitted"}
          onClick={() => setTab("submitted")}
        >
          <FileCheck2 size={18} aria-hidden="true" /> Submitted records
        </button>
        <button
          className="button outline"
          aria-pressed={tab === "private"}
          onClick={() => setTab("private")}
        >
          <FolderLock size={18} aria-hidden="true" /> My private files
        </button>
      </div>
      {tab === "submitted" ? (
        <SubmittedDocuments account={account} />
      ) : (
        <Documents />
      )}
    </div>
  );
}

function SubmittedDocuments({ account }: { account: Account }) {
  const [selected, setSelected] = useState<DetailRecord>();
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const portalPath = usePortalPath();
  function openRecord(row: RecordView) {
    if (row.kind !== "REGISTRATION") setSelected({ ...row, kind: row.kind });
  }
  const result = useLoad(
    useCallback(
      async (signal) =>
        readResponse(await api.GET("/admin/documents", { signal })),
      [],
    ),
  );
  const allowed =
    canAdmin(account, "ENROLMENTS_MANAGE") ||
    canAdmin(account, "SUMMARIES_PUBLISH");
  const rows = result.data?.filter(
    (row) =>
      (filter === "ALL" || row.kind === filter) &&
      (row.personName + " " + row.title)
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <section className="panel stack">
        <div className="list-row document-index-header">
          <div>
            <h2>Submitted records</h2>
            <p className="muted">
              Patient registrations, recorded consent choices, and doctor-signed
              summaries available to your role.
            </p>
          </div>
          <button className="button outline small" onClick={result.reload}>
            <RotateCw size={16} aria-hidden="true" /> Refresh records
          </button>
        </div>
        <p className="document-scope">
          Private uploads stay in their owner’s account. Agreement signing is
          not yet available; consent choices are recorded acknowledgements, not
          signed agreements.
        </p>
        {!allowed ? (
          <p>
            Your account does not have access to submitted records. Ask an
            administrator with access management permissions if you need to
            review them.
          </p>
        ) : (
          <>
            <div className="document-filters">
              <label>
                Search records
                <input
                  type="search"
                  value={query}
                  placeholder="Search by name or document"
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <label>
                Document type
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="ALL">All documents</option>
                  <option value="REGISTRATION">Client registrations</option>
                  <option value="CARE_PERMISSIONS">Care permissions</option>
                  <option value="CONSULTATION">Signed summaries</option>
                </select>
              </label>
            </div>
            {!result.data ? (
              <Loading error={result.error} retry={result.reload} />
            ) : (
              <>
                <p className="muted" role="status">
                  {rows?.length} recent{" "}
                  {rows?.length === 1 ? "record" : "records"} shown
                </p>
                {rows?.length ? (
                  <ul className="submitted-document-list">
                    {rows.map((row) => (
                      <li key={row.kind + row.id}>
                        <div
                          className="document-record-icon"
                          aria-hidden="true"
                        >
                          <FileCheck2 size={22} />
                        </div>
                        <div className="document-record-copy">
                          <h3>{row.title}</h3>
                          <p>
                            {row.personName} ·{" "}
                            {row.personRole === "DOCTOR" ? "Doctor" : "Patient"}
                          </p>
                          <span className="muted">
                            {new Date(row.recordedAt).toLocaleDateString()} ·{" "}
                            {row.status}
                          </span>
                        </div>
                        {row.kind === "REGISTRATION" ? (
                          <Link
                            className="button outline small"
                            to={portalPath(
                              "enrolments/" + row.patientId + "/review",
                            )}
                            aria-label={
                              "Review registration for " + row.personName
                            }
                          >
                            Review registration
                          </Link>
                        ) : (
                          <button
                            className="button outline small"
                            onClick={() => openRecord(row)}
                            aria-label={
                              "View " +
                              row.title.toLowerCase() +
                              " for " +
                              row.personName
                            }
                          >
                            View record
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="document-empty">
                    <FileCheck2 size={32} aria-hidden="true" />
                    <h3>
                      {query || filter !== "ALL"
                        ? "No matching records"
                        : "No submitted records yet"}
                    </h3>
                    <p>
                      {query || filter !== "ALL"
                        ? "Try another name or document type."
                        : "Submitted registrations, care permissions, and signed summaries will appear here when available to your role."}
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>
      {selected && (
        <DocumentDetail
          key={selected.kind + selected.id}
          record={selected}
          close={() => setSelected(undefined)}
        />
      )}
    </>
  );
}

function DocumentDetail({
  record,
  close,
}: {
  record: DetailRecord;
  close: () => void;
}) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    panel.current?.focus({ preventScroll: true });
    panel.current?.scrollIntoView?.({ block: "nearest" });
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true });
    };
  }, []);
  const result = useLoad(
    useCallback(
      async (signal) =>
        readResponse(
          await api.GET("/admin/documents/{kind}/{id}", {
            signal,
            params: { path: { kind: record.kind, id: record.id } },
          }),
        ),
      [record.kind, record.id],
    ),
  );
  const data = result.data;
  return (
    <section
      className="panel stack"
      aria-label="Document details"
      tabIndex={-1}
      ref={panel}
    >
      <div className="list-row">
        <h2>{record.title}</h2>
        <button className="button outline small" onClick={close}>
          Close record
        </button>
      </div>
      {!data ? (
        <Loading error={result.error} retry={result.reload} />
      ) : (
        <>
          <p>
            {data.personName} · {new Date(data.recordedAt).toLocaleString()} ·{" "}
            {data.version}
          </p>
          {data.consent && (
            <>
              <p className="muted">
                Latest recorded choices. These can be changed or withdrawn by
                the patient.
              </p>
              <dl>
                {Object.entries(data.consent.choices).map(([key, value]) => (
                  <div className="form-detail" key={key}>
                    <dt>{choiceLabels[key] ?? "Care permission"}</dt>
                    <dd>{value ? "Agreed" : "Not agreed / withdrawn"}</dd>
                  </div>
                ))}
              </dl>
              {!!data.consent.recipients.length && (
                <div>
                  <h3>Authorised contacts</h3>
                  {data.consent.recipients.map((recipient, i) => (
                    <p key={i}>
                      {recipient.name} · {recipient.relationship} ·{" "}
                      {recipient.phone}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
          {data.summary !== undefined && (
            <>
              <p>
                Patient: {data.patientName} · Visit: {data.visitDate}
              </p>
              <p className="preserve">{data.summary}</p>
              <p className="muted">
                Only the signed summary is shown here. Signed addenda remain
                part of the clinician’s original consultation record.
              </p>
            </>
          )}
        </>
      )}
    </section>
  );
}
