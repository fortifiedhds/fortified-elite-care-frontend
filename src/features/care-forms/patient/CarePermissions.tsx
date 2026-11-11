import { ShieldCheck } from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { api, messageFor, readResponse } from "../../../shared/api/client";
import { ErrorMessage } from "../../../shared/ui/Feedback";
import { Loading } from "../components/FormFields";
import { useLoad } from "../hooks/useFormResource";
import type { Choices, ConsentView, Recipient } from "../types";

const consentItems: [keyof Choices, string, string][] = [
  [
    "healthAssessment",
    "Health assessments",
    "Routine assessments and a review of your health history.",
  ],
  [
    "homeVisits",
    "Home visits",
    "Scheduled visits by authorised healthcare professionals.",
  ],
  [
    "sampleCollection",
    "Sample collection",
    "Collecting samples when medically necessary.",
  ],
  [
    "education",
    "Health education and counselling",
    "Advice and discussion about your health and wellbeing.",
  ],
  [
    "referrals",
    "Referrals",
    "Referring you to another provider when recommended.",
  ],
  [
    "sharing",
    "Sharing with named contacts",
    "Allowing the care team to share approved updates with the people you name.",
  ],
  [
    "emergencyContact",
    "Emergency contact and referral coordination",
    "Contacting someone you nominate or helping coordinate a referral. This is not an emergency service.",
  ],
];

const blankRecipient: Recipient = { name: "", relationship: "", phone: "" };

export function CarePermissions() {
  const result = useLoad(
    useCallback(
      async (signal) =>
        readResponse(await api.GET("/patients/care-permissions", { signal })),
      [],
    ),
  );
  return result.data ? (
    <ConsentEditor initial={result.data} />
  ) : (
    <Loading error={result.error} retry={result.reload} />
  );
}

function ConsentEditor({ initial }: { initial: ConsentView }) {
  const [choices, setChoices] = useState(initial.choices);
  const [recipients, setRecipients] = useState<Recipient[]>(
    initial.recipients.length ? initial.recipients : [{ ...blankRecipient }],
  );
  const [recordedAt, setRecordedAt] = useState(initial.recordedAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    setError("");
    setBusy(true);
    try {
      if (consentItems.some(([k]) => typeof choices[k] !== "boolean"))
        throw new Error("Choose yes or no for each activity.");
      const updated = readResponse(
        await api.POST("/patients/care-permissions", {
          body: {
            version: initial.version,
            choices: choices as Choices,
            recipients: choices.sharing ? recipients : [],
          },
        }),
      );
      setRecordedAt(updated.recordedAt);
      setSaved(true);
    } catch (e) {
      setError(messageFor(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="form-shell">
      <section className="panel">
        <h2>Your care choices</h2>
        <p>
          Choose yes or no for each activity. You can return here to change your
          choices.
        </p>
        <form className="stack" onSubmit={save}>
          {consentItems.map(([key, label, detail]) => (
            <fieldset className="consent-row" key={key} disabled={busy}>
              <legend>{label}</legend>
              <p className="muted">{detail}</p>
              <div className="inline-choice">
                {([true, false] as const).map((v) => (
                  <label className="form-choice" key={String(v)}>
                    <input
                      name={key}
                      type="radio"
                      required
                      checked={choices[key] === v}
                      onChange={() => {
                        setChoices((old) => ({ ...old, [key]: v }));
                        setSaved(false);
                      }}
                    />
                    {v ? "Yes" : "No"}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          {choices.sharing && (
            <div className="stack">
              <h3>Who may receive approved updates?</h3>
              {recipients.map((r, i) => (
                <fieldset key={i} disabled={busy}>
                  <legend>Named person {i + 1}</legend>
                  <div className="form-grid">
                    {(["name", "relationship", "phone"] as const).map((k) => (
                      <label key={k}>
                        {k === "name"
                          ? "Name"
                          : k === "relationship"
                            ? "Relationship"
                            : "Phone number"}
                        <input
                          type={k === "phone" ? "tel" : "text"}
                          required
                          minLength={k === "phone" ? 5 : 2}
                          maxLength={
                            k === "phone" ? 40 : k === "relationship" ? 60 : 100
                          }
                          value={r[k]}
                          onChange={(e) =>
                            setRecipients((old) =>
                              old.map((item, j) =>
                                j === i
                                  ? { ...item, [k]: e.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>
                  {i === 1 && (
                    <button
                      type="button"
                      className="button outline small"
                      onClick={() => setRecipients((old) => old.slice(0, 1))}
                    >
                      Remove second contact
                    </button>
                  )}
                </fieldset>
              ))}
              {recipients.length < 2 && (
                <button
                  type="button"
                  className="button outline small"
                  disabled={busy}
                  onClick={() =>
                    setRecipients((old) => [...old, { ...blankRecipient }])
                  }
                >
                  Add another contact
                </button>
              )}
            </div>
          )}
          <ErrorMessage>{error}</ErrorMessage>
          {saved && (
            <p className="feedback success" role="status">
              Your updated choices are saved.
            </p>
          )}
          <button className="button primary" disabled={busy}>
            {busy ? "Saving…" : "Save care choices"}
          </button>
        </form>
      </section>
      <aside className="panel">
        <ShieldCheck aria-hidden="true" size={22} />
        <h3>Your choices stay separate from your agreement</h3>
        <p>
          These choices do not collect a signature or give your contacts access
          to your account.
        </p>
        {recordedAt && (
          <p className="muted">
            Last saved {new Date(recordedAt).toLocaleDateString("en-NG")}.
          </p>
        )}
        <Link to="/portal/agreement" className="button outline">
          Service agreement
        </Link>
      </aside>
    </div>
  );
}
