import { useCallback, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Navigate, NavLink, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api, apiBase, messageFor, readResponse } from "./api/client";
import type { Account, Dashboard, NoteInput, Visit } from "./api/client";
import {
  Brand,
  dateLabel,
  DemoNotice,
  Empty,
  ErrorMessage,
  TextLink,
} from "./shared";

type Action = (
  request: () => Promise<unknown>,
  message: string,
) => Promise<boolean>;
type Tab = { path: string; label: string; icon: LucideIcon };

const overview = { path: "", label: "Overview", icon: LayoutDashboard };
const inbox = { path: "notifications", label: "Notifications", icon: Bell };
const navigation: Record<Account["role"], Tab[]> = {
  PATIENT: [
    overview,
    { path: "checkups", label: "My checkups", icon: CalendarDays },
    { path: "summaries", label: "Visit summaries", icon: FileText },
    inbox,
  ],
  DOCTOR: [
    overview,
    { path: "available", label: "Available requests", icon: CalendarDays },
    { path: "assigned", label: "Assigned visits", icon: ClipboardCheck },
    inbox,
  ],
  ADMIN: [
    overview,
    { path: "enrolments", label: "Enrolments", icon: Users },
    { path: "visits", label: "Visit management", icon: CalendarDays },
    {
      path: "extra-requests",
      label: "Extra visit requests",
      icon: ClipboardCheck,
    },
    inbox,
  ],
};

const roleNames = {
  PATIENT: "Patient portal",
  DOCTOR: "Doctor portal",
  ADMIN: "Admin portal",
};
const statusLabels = {
  AVAILABLE: "Awaiting doctor",
  ASSIGNED: "Assigned",
  COMPLETED: "Completed",
};
const portalPath = (path: string) => (path ? `/portal/${path}` : "/portal");
const pathParams = (id: string) => ({ params: { path: { id } } });

function Panel({
  title,
  detail,
  children,
}: {
  title: string;
  detail?: string;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <header>
        <h2>{title}</h2>
        {detail && <p>{detail}</p>}
      </header>
      {children}
    </section>
  );
}

function VisitRow({ visit, children }: { visit: Visit; children?: ReactNode }) {
  return (
    <article className="record">
      <div className="record-heading">
        <span className="icon-box">
          <CalendarDays size={20} aria-hidden="true" />
        </span>
        <div>
          <h3>{visit.patientName ?? dateLabel(visit.date)}</h3>
          <p>
            {visit.patientName ? `${dateLabel(visit.date)} · ` : ""}
            {visit.area}
            {visit.extra && " · Extra visit"}
            {visit.doctorName && ` · ${visit.doctorName}`}
          </p>
        </div>
        <span className={`status ${visit.status.toLowerCase()}`}>
          {statusLabels[visit.status]}
        </span>
      </div>
      {children && <div className="record-body">{children}</div>}
    </article>
  );
}

function PatientCheckups({
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
                placeholder="Use a fictional reason"
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

function PatientSummaries({ data }: { data: Dashboard }) {
  const released = data.visits.filter((visit) => visit.summary);
  return (
    <Panel
      title="Released summaries"
      detail="Summaries appear here after the care team reviews them."
    >
      {released.length ? (
        <div className="stack">
          {released.map((visit) => (
            <VisitRow visit={visit} key={visit.id}>
              <p className="preserve">{visit.summary}</p>
            </VisitRow>
          ))}
        </div>
      ) : (
        <Empty title="No summaries yet">
          Your approved visit summaries will appear here.
        </Empty>
      )}
    </Panel>
  );
}

function AvailableVisits({
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
      title="Requests in your service area"
      detail="Choose a suitable date. Patient details become available after assignment."
    >
      {data.available.length ? (
        <div className="stack">
          {data.available.map((visit) => (
            <VisitRow visit={visit} key={visit.id}>
              <button
                className="button primary small"
                disabled={busy}
                onClick={() =>
                  void act(
                    async () =>
                      readResponse(
                        await api.POST(
                          "/visits/{id}/claim",
                          pathParams(visit.id),
                        ),
                      ),
                    "Visit claimed. Find it under Assigned visits.",
                  )
                }
              >
                Claim visit <ArrowRight size={16} aria-hidden="true" />
              </button>
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

function NoteForm({
  visit,
  act,
  busy,
}: {
  visit: Visit;
  act: Action;
  busy: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [validation, setValidation] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidation("");
    const form = new FormData(event.currentTarget);
    const body: NoteInput = {
      observations: String(form.get("observations") ?? ""),
      summary: String(form.get("summary") ?? ""),
    };
    if (confirming) {
      if (!body.observations.trim() || !body.summary.trim()) {
        setValidation("Enter observations and a summary before signing.");
        return;
      }
      void act(
        async () =>
          readResponse(
            await api.POST("/visits/{id}/sign", {
              ...pathParams(visit.id),
              body,
            }),
          ),
        "Note signed and visit completed.",
      );
    } else {
      void act(
        async () =>
          readResponse(
            await api.PATCH("/visits/{id}/note", {
              ...pathParams(visit.id),
              body,
            }),
          ),
        "Draft saved.",
      );
    }
  }

  return (
    <form className="stack" onSubmit={submit}>
      <label>
        Private observations
        <textarea
          name="observations"
          rows={3}
          maxLength={5000}
          defaultValue={visit.observations}
          placeholder="Enter fictional observations only"
        />
      </label>
      <label>
        Patient summary
        <textarea
          name="summary"
          rows={3}
          maxLength={2000}
          defaultValue={visit.summary}
          placeholder="Write a fictional summary for the reviewer"
        />
      </label>
      <ErrorMessage>{validation}</ErrorMessage>
      {confirming && (
        <p className="feedback" role="status">
          Signing locks the note and completes this demo visit.
        </p>
      )}
      <div className="actions">
        {confirming ? (
          <button
            type="button"
            className="button outline small"
            disabled={busy}
            onClick={() => setConfirming(false)}
          >
            Keep editing
          </button>
        ) : (
          <button
            className="button outline small"
            disabled={busy}
            value="draft"
          >
            Save draft
          </button>
        )}
        {confirming ? (
          <button className="button primary small" disabled={busy}>
            Confirm signature
          </button>
        ) : (
          <button
            type="button"
            className="button primary small"
            disabled={busy}
            onClick={() => setConfirming(true)}
          >
            Sign and complete visit
          </button>
        )}
      </div>
    </form>
  );
}

function AssignedVisits({
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
      title="Your assigned visits"
      detail="Document the visit on or after the scheduled date."
    >
      {data.visits.length ? (
        <div className="stack">
          {data.visits.map((visit) => (
            <VisitRow visit={visit} key={visit.id}>
              {visit.hasSignedNote ? (
                <div className="stack">
                  <strong>
                    {visit.published
                      ? "Summary released"
                      : "Signed · awaiting review"}
                  </strong>
                  <p className="preserve">{visit.summary}</p>
                  <details>
                    <summary>Private observations</summary>
                    <p className="preserve">{visit.observations}</p>
                  </details>
                </div>
              ) : visit.date > data.serviceToday ? (
                <p className="muted">Documentation opens on the visit date.</p>
              ) : (
                <NoteForm visit={visit} act={act} busy={busy} />
              )}
            </VisitRow>
          ))}
        </div>
      ) : (
        <Empty title="No assigned visits">
          Visits you claim or receive from the care team will appear here.
        </Empty>
      )}
    </Panel>
  );
}

function Enrolments({
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

function AdminVisits({
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

function ExtraRequests({
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

function Inbox({
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

function Overview({ data }: { data: Dashboard }) {
  const role = data.account.role;
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
            ? "Your enrolment is awaiting care team review."
            : role === "ADMIN"
              ? "Review enrolments, coordinate home visits, and manage exceptions."
              : role === "DOCTOR"
                ? "Find eligible home visits and document your completed checkups."
                : "Manage your routine checkups and see updates from the care team."}
        </p>
        {data.preferredDate && (
          <span className="portal-preference">
            <CalendarDays size={17} aria-hidden="true" /> Preferred date:{" "}
            {dateLabel(data.preferredDate)}
          </span>
        )}
      </section>
      <div className="three-columns">
        {metrics.map(({ label, value, path, icon: Icon }) => (
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

export function Portal({
  account,
  onSignOut,
}: {
  account: Account;
  onSignOut: () => void;
}) {
  const location = useLocation();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      const response = await api.GET("/dashboard", { signal });
      if (response.response.status === 401) {
        onSignOut();
        return;
      }
      setData(readResponse(response));
    },
    [onSignOut],
  );

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal).catch((error) => {
      if (!controller.signal.aborted) setError(messageFor(error));
    });
    return () => controller.abort();
  }, [refresh, location.pathname]);

  async function act(request: () => Promise<unknown>, message: string) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await request();
      setNotice(message);
    } catch (error) {
      setError(messageFor(error));
      return false;
    } finally {
      try {
        await refresh();
      } catch (error) {
        setError(messageFor(error));
      }
      setBusy(false);
    }
    return true;
  }

  async function signOut() {
    setBusy(true);
    try {
      readResponse(await api.POST("/auth/logout"));
      onSignOut();
    } catch (error) {
      setError(messageFor(error));
      setBusy(false);
    }
  }

  async function refreshWorkspace() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await refresh();
      setNotice("Workspace refreshed.");
    } catch (error) {
      setError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  const tabs = navigation[account.role];
  const current = tabs.find(
    ({ path }) => portalPath(path) === location.pathname.replace(/\/$/, ""),
  );
  if (!current) return <Navigate to="/portal" replace />;

  function renderContent() {
    if (!data)
      return error ? (
        <button
          className="button outline"
          onClick={() => {
            setError("");
            void refresh().catch((error) => setError(messageFor(error)));
          }}
        >
          Retry
        </button>
      ) : (
        <p role="status">Loading your workspace…</p>
      );
    const props = { data, act, busy };
    switch (current?.path) {
      case "checkups":
        return <PatientCheckups {...props} />;
      case "summaries":
        return <PatientSummaries data={data} />;
      case "available":
        return <AvailableVisits {...props} />;
      case "assigned":
        return <AssignedVisits {...props} />;
      case "enrolments":
        return <Enrolments {...props} />;
      case "visits":
        return <AdminVisits {...props} />;
      case "extra-requests":
        return <ExtraRequests {...props} />;
      case "notifications":
        return <Inbox {...props} />;
      default:
        return <Overview data={data} />;
    }
  }

  return (
    <div className="portal">
      <DemoNotice />
      <header className="public-header">
        <div className="wrap header-inner">
          <Brand />
          <button
            className="button outline small"
            onClick={() => void signOut()}
            disabled={busy}
          >
            <LogOut size={17} aria-hidden="true" /> Sign out
          </button>
        </div>
      </header>
      <div className="wrap portal-layout">
        <aside className="sidebar">
          <p className="eyebrow">{roleNames[account.role].toUpperCase()}</p>
          <nav aria-label="Portal navigation">
            {tabs.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={portalPath(path)}
                end
                onClick={() => {
                  setError("");
                  setNotice("");
                }}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="portal-main" id="main-content">
          <div className="page-title list-row">
            <div>
              <p className="eyebrow">WORKSPACE</p>
              <h1>{current.label}</h1>
            </div>
            {data && (
              <button
                className="button outline small"
                disabled={busy}
                onClick={() => void refreshWorkspace()}
              >
                Refresh
              </button>
            )}
          </div>
          <ErrorMessage>{error}</ErrorMessage>
          {notice && (
            <p className="feedback success" role="status">
              {notice}
            </p>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
