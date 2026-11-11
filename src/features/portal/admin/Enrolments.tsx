import { Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Dashboard } from "../../../shared/api/client";
import { api, pathParams, readResponse } from "../../../shared/api/client";
import { Empty } from "../../../shared/ui/Feedback";
import { Panel } from "../components/Panel";
import { portalPath } from "../navigation";
import type { Action } from "../types";

export function Enrolments({
  data,
  act,
  busy,
}: {
  data: Dashboard;
  act: Action;
  busy: boolean;
}) {
  const [filter, setFilter] = useState<"PENDING" | "ALL">("PENDING");
  const entries = data.enrolments.filter(
    (account) => filter === "ALL" || account.reviewStatus === filter,
  );

  return (
    <Panel
      title="Review enrolments"
      detail="Review new patients and doctor applications before they enter the visit workflow."
    >
      <label className="filter-label">
        Show
        <select
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value === "ALL" ? "ALL" : "PENDING")
          }
        >
          <option value="PENDING">Awaiting review</option>
          <option value="ALL">All accounts</option>
        </select>
      </label>
      {entries.length ? (
        <div className="stack">
          {entries.map((account) => (
            <div className="record-heading record" key={account.id}>
              <span className="icon-box">
                <Users size={19} aria-hidden="true" />
              </span>
              <div>
                <h3>{account.name}</h3>
                <p>
                  {account.role === "DOCTOR" ? "Doctor" : "Patient"} ·{" "}
                  {account.area}
                  {account.credentialId && ` · ${account.credentialId}`}
                </p>
                {account.role === "PATIENT" && (
                  <Link
                    className="text-link"
                    to={portalPath("enrolments/" + account.id + "/review")}
                  >
                    View submitted registration
                  </Link>
                )}
              </div>
              {account.reviewStatus === "APPROVED" ? (
                <span className="status completed">Approved</span>
              ) : (
                <button
                  className="button primary small"
                  disabled={busy}
                  aria-label={`Approve ${account.name}`}
                  onClick={() =>
                    void act(
                      async () =>
                        readResponse(
                          await api.PATCH(
                            "/admin/enrolments/{id}/approve",
                            pathParams(account.id),
                          ),
                        ),
                      "Enrolment approved.",
                    )
                  }
                >
                  Approve
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Empty title="No matching accounts">
          Enrolment records will appear here.
        </Empty>
      )}
    </Panel>
  );
}
