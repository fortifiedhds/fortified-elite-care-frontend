import { Download, FileCheck2, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import {
  api,
  apiBase,
  messageFor,
  readResponse,
  UserFacingError,
} from "../../shared/api/client";
import type { components } from "../../shared/api/schema";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { useLoad } from "../care-forms/hooks/useFormResource";
import { Loading } from "../care-forms/components/FormFields";

type Credentials = components["schemas"]["DoctorCredentialsView"];
const certificates = [
  {
    kind: "MEDICAL_DEGREE",
    field: "medicalDegree",
    title: "University Medical Certificate",
    detail: "Upload the university certificate for your medical education.",
  },
  {
    kind: "MDCN_REGISTRATION",
    field: "mdcnRegistration",
    title: "MDCN Certificate of Registration",
    detail:
      "Upload your certificate of registration with the Medical and Dental Council of Nigeria.",
  },
] as const;

export function DoctorCredentials({ doctorId }: { doctorId?: string }) {
  const admin = Boolean(doctorId);
  const result = useLoad(
    useCallback(
      async (signal) =>
        readResponse(
          doctorId
            ? await api.GET("/admin/doctors/{id}/credentials", {
                params: { path: { id: doctorId } },
                signal,
              })
            : await api.GET("/doctors/credentials", { signal }),
        ),
      [doctorId],
    ),
  );
  const [files, setFiles] = useState<
    Partial<Record<"medicalDegree" | "mdcnRegistration", File>>
  >({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reviewedRevision, setReviewedRevision] = useState<number>();
  const data = result.data;
  const complete =
    data &&
    certificates.every((c) =>
      data.certificates.some((file) => file.kind === c.kind),
    ) &&
    Boolean(data.submittedAt);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) return;
    setError("");
    setNotice("");
    setBusy(true);
    const form = event.currentTarget;
    try {
      const body = new FormData();
      for (const c of certificates) {
        const file = files[c.field];
        if (!file || !file.size || file.size > 10 * 1024 * 1024)
          throw new UserFacingError(
            "Choose both certificates, up to 10 MB each.",
          );
        body.append(c.field, file);
      }
      const response = await fetch(apiBase + "/doctors/credentials", {
        method: "POST",
        credentials: "include",
        body,
      });
      const json = await response.json();
      readResponse<Credentials>({
        response,
        ...(response.ok ? { data: json } : { error: json }),
      });
      setFiles({});
      form.reset();
      result.reload();
      setNotice(
        "Both certificates have been submitted. The care team can now review your application.",
      );
    } catch (error) {
      setError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }
  async function approve() {
    if (!data || !complete || reviewedRevision !== data.revision) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      readResponse(
        await api.PATCH("/admin/enrolments/{id}/approve", {
          params: { path: { id: data.doctorId } },
          body: { credentialsRevision: data.revision },
        }),
      );
      setReviewedRevision(undefined);
      result.reload();
      setNotice("Doctor application approved.");
    } catch (error) {
      setError(messageFor(error));
      setReviewedRevision(undefined);
      result.reload();
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel stack certificate-review" aria-busy={busy}>
      <div>
        <p className="eyebrow">
          {!admin && data?.reviewStatus === "PENDING" && !complete
            ? "STEP 2 OF 2 · CERTIFICATES"
            : "DOCTOR APPLICATION"}
        </p>
        <h2>
          {admin
            ? (data?.name ?? "Review certificates")
            : "Your medical certificates"}
        </h2>
        <p>
          {admin
            ? "Check the MDCN Folio Number and both certificates before approving this doctor."
            : "Both certificates are required before the care team can review your application. They are shared securely with authorised enrolment reviewers."}
        </p>
      </div>
      {!data && <Loading error={result.error} retry={result.reload} />}
      <ErrorMessage>{error}</ErrorMessage>
      {notice && <p role="status">{notice}</p>}
      {data && (
        <>
          <p>
            <strong>MDCN Folio Number:</strong> {data.credentialId}
          </p>
          <p className="status">
            {data.reviewStatus === "APPROVED"
              ? "Approved"
              : complete
                ? "Certificates submitted · Awaiting review"
                : "Action needed · Both certificates required"}
          </p>
          {data.submittedAt && (
            <p className="muted">
              Last submitted {new Date(data.submittedAt).toLocaleString()} ·
              Version {data.revision}
            </p>
          )}
          {(admin || data.certificates.length > 0) && (
            <div className="stack">
              {certificates.map((c) => {
                const file = data.certificates.find(
                  (file) => file.kind === c.kind,
                );
                const download = admin
                  ? "/admin/doctors/" + data.doctorId + "/credentials/"
                  : "/doctors/credentials/";
                return (
                  <article className="record stack" key={c.kind}>
                    <h3>
                      <FileCheck2 size={18} aria-hidden="true" /> {c.title}
                    </h3>
                    {file ? (
                      <>
                        <p className="muted">
                          {file.name} · {(file.bytes / 1024).toFixed(0)} KB
                        </p>
                        <a
                          className="text-link"
                          href={apiBase + download + c.kind + "/download"}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download size={16} aria-hidden="true" /> Open{" "}
                          {c.title}
                        </a>
                      </>
                    ) : (
                      <p className="muted">Not yet submitted.</p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
          {!admin && data.reviewStatus === "PENDING" && (
            <form className="stack" onSubmit={submit}>
              <h3>
                {complete
                  ? "Replace your certificates"
                  : "Upload your certificates"}
              </h3>
              <p className="muted">
                PDF, JPEG or PNG, up to 10 MB per file. Make sure the full
                certificate is readable.{" "}
                {complete &&
                  "Choose both files again to submit a new version for review."}
              </p>
              {certificates.map((c) => (
                <label className="certificate-upload" key={c.field}>
                  {c.title} <small>(required)</small>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    required
                    disabled={busy}
                    aria-describedby={c.field + "-help"}
                    onChange={(e) =>
                      setFiles((previous) => ({
                        ...previous,
                        [c.field]: e.target.files?.[0],
                      }))
                    }
                  />
                  <small id={c.field + "-help"}>{c.detail}</small>
                </label>
              ))}
              <div className="actions">
                <button
                  className="button primary"
                  disabled={
                    busy || !files.medicalDegree || !files.mdcnRegistration
                  }
                >
                  <Upload size={17} aria-hidden="true" />
                  {busy ? "Submitting…" : "Submit both certificates"}
                </button>
              </div>
            </form>
          )}
          {!admin && data.reviewStatus === "APPROVED" && (
            <p className="muted">
              Contact the care team if your certificates need to be updated.
            </p>
          )}
          {admin && data.reviewStatus === "PENDING" && (
            <div className="stack">
              {!complete && (
                <p>
                  The doctor must upload both certificates before approval is
                  available.
                </p>
              )}
              <label className="certificate-confirmation">
                <input
                  type="checkbox"
                  checked={reviewedRevision === data.revision}
                  disabled={!complete || busy}
                  onChange={(e) =>
                    setReviewedRevision(
                      e.target.checked ? data.revision : undefined,
                    )
                  }
                />
                I have reviewed both certificates and the MDCN Folio Number.
              </label>
              <div className="actions">
                <button
                  className="button primary"
                  disabled={
                    !complete || reviewedRevision !== data.revision || busy
                  }
                  onClick={() => void approve()}
                >
                  {busy ? "Approving…" : "Approve doctor"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
