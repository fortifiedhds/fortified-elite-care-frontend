import { useState } from "react";
import type { Dashboard } from "../../../shared/api/client";
import { api, readResponse } from "../../../shared/api/client";
import { Empty } from "../../../shared/ui/Feedback";
import { Panel } from "../components/Panel";
import { VisitRow } from "../components/VisitRow";
import type { Action } from "../types";
import { MonthlyDayField } from "../../scheduling/MonthlyDayField";
import {
  nextVisitMonth,
  ordinal,
  visitDate,
} from "../../../shared/lib/monthly-schedule";
import { dateLabel } from "../../../shared/lib/dates";

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
  const [day, setDay] = useState(String(data.preferredDayOfMonth ?? ""));
  const [selectedMonth, setSelectedMonth] = useState("");
  const savedDay = data.preferredDayOfMonth;
  const minimumMonth = nextVisitMonth(data.serviceToday, savedDay ?? 1);
  const suggestedMonth = nextVisitMonth(
    data.serviceToday,
    savedDay ?? 1,
    data.visits
      .filter((visit) => !visit.extra)
      .map((visit) => visit.date.slice(0, 7)),
  );
  const month = selectedMonth || suggestedMonth;
  const date = savedDay ? visitDate(month, savedDay) : undefined;
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
                ? "Choose a monthly visit day, then request a routine checkup."
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
          title="Your monthly visit day"
          detail="Choose the day that suits you each month."
        >
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              void act(
                async () =>
                  readResponse(
                    await api.PATCH("/patients/preference", {
                      body: { dayOfMonth: Number(day) },
                    }),
                  ),
                "Monthly visit day saved. Existing appointments stay as arranged.",
              );
            }}
          >
            <MonthlyDayField value={day} onChange={setDay} />
            <button
              className="button outline small"
              disabled={busy || !day || Number(day) === savedDay}
            >
              Save monthly day
            </button>
          </form>
        </Panel>
        <Panel
          title="Request a routine checkup"
          detail="One routine checkup per calendar month, using your saved visit day."
        >
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              void act(
                async () =>
                  readResponse(await api.POST("/visits", { body: { month } })),
                "Routine checkup requested.",
              );
            }}
          >
            <label>
              Visit month
              <input
                type="month"
                value={month}
                min={minimumMonth}
                required
                disabled={!savedDay}
                onChange={(event) => setSelectedMonth(event.target.value)}
              />
            </label>
            {date ? (
              <p role="status">
                Requested visit: <strong>{dateLabel(date)}</strong>. Your
                preference is the {ordinal(savedDay!)} of each month
                {Number(date.slice(-2)) !== savedDay
                  ? "; this shorter month uses its last day"
                  : ""}
                . The care team will confirm your appointment.
              </p>
            ) : (
              <p className="muted">
                Choose and save your monthly visit day first.
              </p>
            )}
            <div className="actions">
              <button
                className="button primary small"
                disabled={
                  busy || !approved || !date || date < data.serviceToday
                }
              >
                Request checkup
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
