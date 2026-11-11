import type { Dashboard } from "../../../shared/api/client";
import { api, pathParams, readResponse } from "../../../shared/api/client";
import { Empty } from "../../../shared/ui/Feedback";
import { Panel } from "../components/Panel";
import type { Action } from "../types";

export function Inbox({
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
      title="Inbox"
      detail="Updates from the care team and the visit workflow."
    >
      {data.notifications.length ? (
        <div className="stack">
          {data.notifications.map((item) => (
            <div className="list-row record" key={item.id}>
              <p>{item.message}</p>
              {!item.read && (
                <button
                  className="button outline small"
                  disabled={busy}
                  onClick={() =>
                    void act(
                      async () =>
                        readResponse(
                          await api.PATCH(
                            "/notifications/{id}/read",
                            pathParams(item.id),
                          ),
                        ),
                      "Notification marked as read.",
                    )
                  }
                >
                  Mark as read
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Empty title="You’re all caught up">
          Account and visit updates will appear here.
        </Empty>
      )}
    </Panel>
  );
}
