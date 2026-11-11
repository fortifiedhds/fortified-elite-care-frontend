import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, HeartPulse, Stethoscope } from "lucide-react";
import { api, messageFor, readResponse } from "./api/client";
import type { Account, PatientInput } from "./api/client";
import { Brand, ErrorMessage } from "./shared";

type Props = { account: Account | null; onAccount: (account: Account) => void };

function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <>
      <header className="public-header">
        <div className="wrap header-inner">
          <Brand />
          <Link className="text-link" to="/">
            <ArrowLeft size={16} aria-hidden="true" /> Home
          </Link>
        </div>
      </header>
      <main className="auth-main" id="main-content">
        <section className="auth-card">
          <p className="eyebrow">FORTIFIED ELITE CARE</p>
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
        </section>
      </main>
    </>
  );
}

export function Login({ account, onAccount }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (account) return <Navigate to="/portal" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      onAccount(
        readResponse(
          await api.POST("/auth/login", { body: { email, password } }),
        ),
      );
    } catch (error) {
      setError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Fortified Elite Care account."
    >
      <form onSubmit={submit} className="stack">
        <label>
          Email address
          <input
            autoComplete="username"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            autoComplete="current-password"
            type="password"
            minLength={12}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <ErrorMessage>{error}</ErrorMessage>
        <button className="button primary" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      </form>
      <p className="form-footer">
        New to Fortified Elite Care?{" "}
        <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}

const consentChoices = [
  ["healthAssessment", "Routine health assessments"],
  ["homeVisits", "Scheduled home visits"],
  ["sampleCollection", "Sample collection"],
  ["education", "Health education and counselling"],
  ["referrals", "Referrals to other providers"],
  ["emergencyContact", "Contacting your emergency contact"],
] as const;

function todayInLagos() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(
    new Date(),
  );
}

export function Register({ account, onAccount }: Props) {
  const [params] = useSearchParams();
  const requestedRole = params.get("role");
  const [role, setRole] = useState<"patient" | "doctor" | null>(
    requestedRole === "patient" || requestedRole === "doctor"
      ? requestedRole
      : null,
  );
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState({
    name: "",
    email: "",
    password: "",
    area: "",
    preferredDate: "",
    sponsorName: "",
    credentialId: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (account) return <Navigate to="/portal" replace />;

  function update(key: keyof typeof details, value: string) {
    setDetails({ ...details, [key]: value });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!role) {
      setError("Choose whether to enrol as a patient or apply as a doctor.");
      return;
    }
    if (role === "patient" && step === 1) {
      setStep(2);
      return;
    }
    const form = new FormData(event.currentTarget);
    const {
      email,
      password,
      name,
      area,
      credentialId,
      preferredDate,
      sponsorName,
    } = details;
    setBusy(true);
    try {
      const base = { email, password, name, area };
      if (role === "doctor") {
        onAccount(
          readResponse(
            await api.POST("/auth/register/doctor", {
              body: { ...base, credentialId },
            }),
          ),
        );
      } else {
        const choices = Object.fromEntries(
          consentChoices.map(([key]) => [key, form.get(key) === "yes"]),
        ) as Pick<PatientInput, (typeof consentChoices)[number][0]>;
        onAccount(
          readResponse(
            await api.POST("/auth/register/patient", {
              body: {
                ...base,
                preferredDate,
                sponsorName: sponsorName.trim() || undefined,
                ...choices,
              },
            }),
          ),
        );
      }
    } catch (error) {
      setError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title={
        step === 2
          ? "Care permissions"
          : role === "doctor"
            ? "Doctor application"
            : "Create an account"
      }
      subtitle={
        step === 2
          ? "Choose what you agree to. The care team will review your choices during enrolment."
          : "Enrol as a patient or apply to join as a doctor. The care team reviews each application."
      }
    >
      <form className="stack" onSubmit={submit}>
        {step === 1 ? (
          <>
            <fieldset className="role-options">
              <legend>Account type</legend>
              <label>
                <input
                  type="radio"
                  name="role"
                  value="patient"
                  required
                  checked={role === "patient"}
                  onChange={() => setRole("patient")}
                />
                <HeartPulse size={20} aria-hidden="true" /> Patient
              </label>
              <label>
                <input
                  type="radio"
                  name="role"
                  value="doctor"
                  required
                  checked={role === "doctor"}
                  onChange={() => setRole("doctor")}
                />
                <Stethoscope size={20} aria-hidden="true" /> Doctor
              </label>
            </fieldset>
            {role && (
              <>
                <label>
                  Full name
                  <input
                    value={details.name}
                    onChange={(event) => update("name", event.target.value)}
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </label>
                <label>
                  Email address
                  <input
                    type="email"
                    autoComplete="username"
                    value={details.email}
                    onChange={(event) => update("email", event.target.value)}
                    required
                    maxLength={254}
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={details.password}
                    onChange={(event) => update("password", event.target.value)}
                    minLength={12}
                    maxLength={128}
                    required
                  />
                  <small>Use at least 12 characters.</small>
                </label>
                <label>
                  {role === "doctor"
                    ? "Area you cover for home visits"
                    : "Area where you live"}
                  <input
                    value={details.area}
                    onChange={(event) => update("area", event.target.value)}
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </label>
                {role === "doctor" ? (
                  <label>
                    Professional registration or licence number
                    <input
                      value={details.credentialId}
                      onChange={(event) =>
                        update("credentialId", event.target.value)
                      }
                      required
                      minLength={3}
                      maxLength={80}
                    />
                  </label>
                ) : (
                  <>
                    <label>
                      Preferred visit date
                      <input
                        type="date"
                        min={todayInLagos()}
                        value={details.preferredDate}
                        onChange={(event) =>
                          update("preferredDate", event.target.value)
                        }
                        required
                      />
                    </label>
                    <label>
                      Sponsor name <small>(optional)</small>
                      <input
                        value={details.sponsorName}
                        onChange={(event) =>
                          update("sponsorName", event.target.value)
                        }
                        minLength={2}
                        maxLength={100}
                      />
                    </label>
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <div className="consent-list">
            {consentChoices.map(([key, title]) => (
              <fieldset key={key}>
                <legend>{title}</legend>
                <label>
                  <input type="radio" name={key} value="yes" required /> Yes
                </label>
                <label>
                  <input type="radio" name={key} value="no" required /> No
                </label>
              </fieldset>
            ))}
          </div>
        )}
        <ErrorMessage>{error}</ErrorMessage>
        <div className="actions">
          {step === 2 && (
            <button
              type="button"
              className="button outline"
              onClick={() => {
                setError("");
                setStep(1);
              }}
              disabled={busy}
            >
              <ArrowLeft size={17} aria-hidden="true" /> Back
            </button>
          )}
          <button className="button primary" disabled={busy}>
            {busy
              ? "Creating account…"
              : role === "patient" && step === 1
                ? "Continue to care permissions"
                : "Submit application"}{" "}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
      </form>
      <p className="form-footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
