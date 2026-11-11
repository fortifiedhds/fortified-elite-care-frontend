import { useState } from "react";
import type { Dashboard } from "../../../shared/api/client";
import { api, readResponse } from "../../../shared/api/client";
import { Empty } from "../../../shared/ui/Feedback";
import { Panel } from "../components/Panel";
import { VisitRow } from "../components/VisitRow";
import type { Action } from "../types";

export function PatientCheckups({
  data,
  act,
  busy,
}: {
  data: Dashboard;
  act: Action;
  busy: boolean;
}) {
  const approved = data.account.reviewStatus === "APPROVED";
  const preferred =
    data.preferredDate && data.preferredDate >= data.serviceToday
      ? data.preferredDate
      : data.serviceToday;
  const [date, setDate] = useState(preferred);
  const [reason, setReason] = useState("");

  return (
    <div className="portal-grid">
      <div className="stack">
        <Panel
          title="Your visits"
          detail="Follow the status of your routine and extra checkups."
        >
          {data.visits.length ? (
            <div className="stack">
              {data.visits.map((visit) => (
                <VisitRow visit={visit} key={visit.id} />
              ))}
            </div>
          ) : (
            <Empty title="No visits yet">
              {approved
                ? "Request a routine checkup using your preferred date."
                : "The care team will review your enrolment first."}
            </Empty>
          )}
        </Panel>
        <Panel
          title="Extra visit requests"
          detail="A care team member reviews requests for additional checkups."
        >
          {data.support.length ? (
            <div className="stack">
              {data.support.map((request) => (
                <div className="list-row" key={request.id}>
                  <p>{request.reason}</p>
                  <span
                    className={`status ${request.approved ? "completed" : "available"}`}
                  >
                    {request.approved ? "Approved" : "In review"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="No extra requests">
              Requests you submit will appear here.
            </Empty>
          )}
        </Panel>
      </div>
      <div className="stack">
        <Panel
          title="Request a routine checkup"
          detail="One routine checkup is available per calendar month."
        >
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              void act(
                async () =>
                  readResponse(await api.POST("/visits", { body: { date } })),
                "Routine checkup requested.",
              );
            }}
          >
            <label>
              Visit date
              <input
                type="date"
                value={date}
                min={data.serviceToday}
                required
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            <div className="actions">
              <button
                className="button primary small"
                disabled={busy || !approved}
              >
                Request checkup
              </button>
              <button
                type="button"
                className="button outline small"
                disabled={busy || date < data.serviceToday}
                onClick={() =>
                  void act(
                    async () =>
                      readResponse(
                        await api.PATCH("/patients/preference", {
                          body: { date },
                        }),
                      ),
                    "Preferred date saved.",
                  )
                }
              >
                Save as preferred
              </button>
            </div>
            {!approved && (
              <p className="muted">
                The care team must approve your enrolment before you can request
                a visit.
              </p>
            )}
          </form>
        </Panel>
        <Panel title="Need an extra visit?">
          <form
            className="stack"
            onSubmit={async (event) => {
              event.preventDefault();
              if (
                await act(
                  async () =>
                    readResponse(
                      await api.POST("/extra-visits", { body: { reason } }),
                    ),
                  "Request sent to the care team.",
                )
              )
                setReason("");
            }}
          >
            <label>
              Reason
              <textarea
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Tell the care team why you need another visit"
                required
                minLength={5}
                maxLength={500}
              />
            </label>
            <button
              className="button outline small"
              disabled={busy || !approved}
            >
              Send request
            </button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
