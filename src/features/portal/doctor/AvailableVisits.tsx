import { ArrowRight } from "lucide-react";
import { useState } from "react";
import type { Dashboard } from "../../../shared/api/client";
import { api, pathParams, readResponse } from "../../../shared/api/client";
import { dateLabel } from "../../../shared/lib/dates";
import { Empty } from "../../../shared/ui/Feedback";
import { Panel } from "../components/Panel";
import { VisitRow } from "../components/VisitRow";
import type { Action } from "../types";

export function AvailableVisits({
  data,
  act,
  busy,
}: {
  data: Dashboard;
  act: Action;
  busy: boolean;
}) {
  const [reviewing, setReviewing] = useState<string | null>(null);
  return (
    <Panel
      title="Requests in your service area"
      detail="Choose a suitable date. Patient details become available after assignment."
    >
      {data.available.length ? (
        <div className="stack">
          {data.available.map((visit) => (
            <VisitRow visit={visit} key={visit.id}>
              {reviewing === visit.id ? (
                <div className="stack">
                  <p>
                    Confirm you can cover {visit.area} on{" "}
                    {dateLabel(visit.date)}.
                  </p>
                  <div className="actions">
                    <button
                      className="button outline small"
                      type="button"
                      disabled={busy}
                      onClick={() => setReviewing(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="button primary small"
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        await act(
                          async () =>
                            readResponse(
                              await api.POST(
                                "/visits/{id}/claim",
                                pathParams(visit.id),
                              ),
                            ),
                          "Visit claimed. Find it under Assigned visits.",
                        );
                        setReviewing(null);
                      }}
                    >
                      Confirm claim
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="button primary small"
                  type="button"
                  disabled={busy}
                  onClick={() => setReviewing(visit.id)}
                >
                  Review request <ArrowRight size={16} aria-hidden="true" />
                </button>
              )}
            </VisitRow>
          ))}
        </div>
      ) : (
        <Empty title="No requests available">
          {data.account.reviewStatus === "PENDING"
            ? "The care team is reviewing your application."
            : "Eligible requests will appear here when patients request a checkup."}
        </Empty>
      )}
    </Panel>
  );
}
