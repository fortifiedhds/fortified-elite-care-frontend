import { LogOut, Menu, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { matchPath, Navigate, NavLink, useLocation } from "react-router-dom";
import type { Account, Dashboard } from "../../shared/api/client";
import { api, messageFor, readResponse } from "../../shared/api/client";
import { Brand } from "../../shared/ui/Brand";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { ServiceAgreement } from "../agreements/ServiceAgreement";
import { Billing } from "../billing/Billing";
import { RegistrationReview } from "../care-forms/admin/RegistrationReview";
import { ClinicianBaseline } from "../care-forms/doctor/ClinicianBaseline";
import { CarePermissions } from "../care-forms/patient/CarePermissions";
import { PatientForm } from "../care-forms/patient/PatientForm";
import { Enrolments } from "./admin/Enrolments";
import { AdminVisits, ExtraRequests } from "./admin/VisitManagement";
import { AssignedVisitDetail, AssignedVisits } from "./doctor/AssignedVisits";
import { AvailableVisits } from "./doctor/AvailableVisits";
import { navigation, roleNames } from "./navigation";
import { canAdmin } from "./permissions";
import { Settings } from "../settings/Settings";
import { CareDocuments } from "../files/CareDocuments";
import { AdminDocuments } from "../files/AdminDocuments";
import { Administrators } from "./admin/Administrators";
import { Inbox } from "./notifications/Inbox";
import { Overview } from "./Overview";
import {
  PatientSummaries,
  PatientVisitDetail,
  PatientVisitList,
} from "./patient/Appointments";
import { PatientCheckups } from "./patient/PatientCheckups";
import { useMobileMenu } from "../../shared/hooks/useMobileMenu";

export function Portal({
  account,
  onSignOut,
  basePath = "/portal",
}: {
  account: Account;
  onSignOut: () => void;
  basePath?: string;
}) {
  const location = useLocation();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const {
    open: menuOpen,
    toggle: toggleMenu,
    close: closeMenu,
    shellRef,
    panelRef,
    toggleRef,
  } = useMobileMenu<HTMLDivElement>(800);
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

  const currentAccount = data?.account ?? account;
  const tabs = navigation[account.role].filter(
    (tab) =>
      !tab.permission ||
      canAdmin(currentAccount, tab.permission) ||
      (tab.path === "visits" && canAdmin(currentAccount, "SUMMARIES_PUBLISH")),
  );
  const portalPath = (path: string) =>
    path ? basePath + "/" + path : basePath;
  const baselineMatch =
    account.role === "DOCTOR"
      ? matchPath("/portal/assigned/:id/baseline", location.pathname)
      : null;
  const reviewMatch =
    account.role === "ADMIN"
      ? matchPath(basePath + "/enrolments/:id/review", location.pathname)
      : null;
  const patientVisit =
    account.role === "PATIENT"
      ? matchPath("/portal/appointments/:id", location.pathname)
      : null;
  const doctorVisit =
    account.role === "DOCTOR"
      ? matchPath("/portal/assigned/:id", location.pathname)
      : null;
  const parentPath =
    baselineMatch || doctorVisit
      ? "assigned"
      : reviewMatch
        ? "enrolments"
        : patientVisit
          ? "appointments"
          : undefined;
  const current = parentPath
    ? tabs.find((tab) => tab.path === parentPath)
    : tabs.find(
        ({ path }) => portalPath(path) === location.pathname.replace(/\/$/, ""),
      );
  if (!current) return <Navigate to={basePath} replace />;

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
    if (baselineMatch?.params.id)
      return (
        <ClinicianBaseline
          key={baselineMatch.params.id}
          id={baselineMatch.params.id}
        />
      );
    if (reviewMatch?.params.id)
      return (
        <RegistrationReview
          key={reviewMatch.params.id}
          id={reviewMatch.params.id}
        />
      );
    if (patientVisit?.params.id)
      return <PatientVisitDetail data={data} id={patientVisit.params.id} />;
    if (doctorVisit?.params.id)
      return <AssignedVisitDetail {...props} id={doctorVisit.params.id} />;
    switch (current?.path) {
      case "checkups":
        return <PatientCheckups {...props} />;
      case "summaries":
        return <PatientSummaries data={data} />;
      case "appointments":
        return <PatientVisitList data={data} />;
      case "history":
        return <PatientVisitList data={data} history />;
      case "registration":
        return (
          <PatientForm
            key="REGISTRATION"
            account={data.account}
            kind="REGISTRATION"
          />
        );
      case "baseline":
        return (
          <PatientForm
            key="BASELINE_SELF"
            account={data.account}
            kind="BASELINE_SELF"
          />
        );
      case "consent":
        return <CarePermissions />;
      case "agreement":
        return <ServiceAgreement />;
      case "payments":
        return <Billing />;
      case "available":
        return <AvailableVisits {...props} />;
      case "assigned":
        return <AssignedVisits data={data} />;
      case "enrolments":
        return <Enrolments {...props} />;
      case "visits":
        return <AdminVisits {...props} />;
      case "extra-requests":
        return <ExtraRequests {...props} />;
      case "notifications":
        return <Inbox {...props} />;
      case "settings":
        return <Settings />;
      case "documents":
        return account.role === "ADMIN" ? (
          <AdminDocuments account={currentAccount} />
        ) : (
          <CareDocuments account={currentAccount} />
        );
      case "administrators":
        return <Administrators refresh={refresh} />;
      default:
        return <Overview data={data} />;
    }
  }

  return (
    <div className="portal" ref={shellRef}>
      <header className="public-header">
        <div className="wrap header-inner">
          <div className="actions">
            <Brand />
            <button
              className="menu-toggle portal-mobile-menu"
              ref={toggleRef}
              aria-label={
                menuOpen ? "Close portal navigation" : "Open portal navigation"
              }
              aria-controls="portal-navigation"
              aria-expanded={menuOpen}
              type="button"
              onClick={toggleMenu}
            >
              {menuOpen ? (
                <X aria-hidden="true" />
              ) : (
                <Menu aria-hidden="true" />
              )}
            </button>
          </div>
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
        <aside
          className="sidebar"
          id="portal-navigation"
          hidden={!menuOpen}
          ref={panelRef}
        >
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
                  closeMenu();
                }}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main
          className="portal-main page-enter"
          inert={menuOpen ? true : undefined}
          id="main-content"
          key={location.pathname}
        >
          <div className="page-title list-row">
            <div>
              <p className="eyebrow">{roleNames[account.role].toUpperCase()}</p>
              <h1>
                {baselineMatch
                  ? "Clinician baseline assessment"
                  : reviewMatch
                    ? "Registration review"
                    : patientVisit || doctorVisit
                      ? "Appointment details"
                      : current.label}
              </h1>
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
