import type { Dashboard } from "../../../shared/api/client";
import { api, pathParams, readResponse } from "../../../shared/api/client";
import { Empty } from "../../../shared/ui/Feedback";
import { Panel } from "../components/Panel";
import { VisitRow } from "../components/VisitRow";
import type { Action } from "../types";

export function AdminVisits({
  data,
  act,
  busy,
}: {
  data: Dashboard;
  act: Action;
  busy: boolean;
}) {
  return (
    <Panel
      title="Visit management"
      detail="Assign eligible doctors and release reviewed visit summaries."
    >
      {data.visits.length ? (
        <div className="stack">
          {data.visits.map((visit) => {
            const doctors = data.enrolments.filter(
              (account) =>
                account.role === "DOCTOR" &&
                account.reviewStatus === "APPROVED" &&
                account.area.toLowerCase() === visit.area.toLowerCase(),
            );
            return (
              <VisitRow visit={visit} key={visit.id}>
                {visit.status !== "COMPLETED" &&
                  visit.date >= data.serviceToday &&
                  doctors.length > 0 && (
                    <form
                      key={visit.doctorId}
                      className="inline-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const doctorId = String(
                          new FormData(event.currentTarget).get("doctorId"),
                        );
                        void act(
                          async () =>
                            readResponse(
                              await api.PATCH("/admin/visits/{id}/assignment", {
                                ...pathParams(visit.id),
                                body: { doctorId },
                              }),
                            ),
                          "Assignment updated.",
                        );
                      }}
                    >
                      <label>
                        Assign doctor
                        <select
                          name="doctorId"
                          defaultValue={visit.doctorId ?? ""}
                          required
                        >
                          <option value="" disabled>
                            Select an approved doctor
                          </option>
                          {doctors.map((doctor) => (
                            <option key={doctor.id} value={doctor.id}>
                              {doctor.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button className="button outline small" disabled={busy}>
                        Save assignment
                      </button>
                    </form>
                  )}
                {visit.hasSignedNote && (
                  <div className="stack">
                    <strong>
                      {visit.published
                        ? "Summary released"
                        : "Signed · awaiting review"}
                    </strong>
                    {visit.summary && (
                      <p className="preserve">{visit.summary}</p>
                    )}
                    {!visit.published && data.account.clinicalReviewer && (
                      <button
                        className="button primary small"
                        disabled={busy}
                        onClick={() =>
                          void act(
                            async () =>
                              readResponse(
                                await api.POST(
                                  "/admin/visits/{id}/publish",
                                  pathParams(visit.id),
                                ),
                              ),
                            "Summary released to the patient.",
                          )
                        }
                      >
                        Release summary
                      </button>
                    )}
                  </div>
                )}
              </VisitRow>
            );
          })}
        </div>
      ) : (
        <Empty title="No visits to manage">
          Visits appear here when patients request a checkup.
        </Empty>
      )}
    </Panel>
  );
}

export function ExtraRequests({
  data,
  act,
  busy,
}: {
  data: Dashboard;
  act: Action;
  busy: boolean;
}) {
  return (
    <Panel
      title="Additional checkup requests"
      detail="Approve an exception with a date and a decision note."
    >
      {data.support.length ? (
        <div className="stack">
          {data.support.map((request) => (
            <article className="record stack" key={request.id}>
              <div className="list-row">
                <div>
                  <h3>{request.patientName}</h3>
                  <p>{request.reason}</p>
                </div>
                <span
                  className={`status ${request.approved ? "completed" : "available"}`}
                >
                  {request.approved ? "Approved" : "In review"}
                </span>
              </div>
              {!request.approved && (
                <form
                  className="inline-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    const body = {
                      date: String(form.get("date")),
                      decision: String(form.get("decision")),
                    };
                    void act(
                      async () =>
                        readResponse(
                          await api.POST("/admin/extra-visits/{id}/approve", {
                            ...pathParams(request.id),
                            body,
                          }),
                        ),
                      "Extra checkup approved.",
                    );
                  }}
                >
                  <label>
                    Visit date
                    <input
                      name="date"
                      type="date"
                      min={data.serviceToday}
                      required
                    />
                  </label>
                  <label>
                    Decision note
                    <input
                      name="decision"
                      minLength={5}
                      maxLength={500}
                      required
                    />
                  </label>
                  <button className="button primary small" disabled={busy}>
                    Approve extra visit
                  </button>
                </form>
              )}
            </article>
          ))}
        </div>
      ) : (
        <Empty title="No extra requests">
          Requests for additional checkups will appear here.
        </Empty>
      )}
    </Panel>
  );
}
