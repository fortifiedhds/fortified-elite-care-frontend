import { ArrowRight, Check, LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, messageFor, readResponse } from "../../../shared/api/client";
import { careEmail } from "../../../shared/lib/contact";
import { siteHref } from "../../../shared/lib/sites";
import { ErrorMessage } from "../../../shared/ui/Feedback";
import type { components } from "../../../shared/api/schema";

const topics = [
  ["CARE_ENQUIRY", "Care and packages"],
  ["FEEDBACK", "Feedback"],
  ["CAREERS", "Careers"],
  ["GENERAL", "General enquiry"],
] as const;

export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [messageLength, setMessageLength] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const focusName = useRef(false);
  useEffect(() => {
    if (sent || error) feedback.current?.focus({ preventScroll: true });
    if (!sent && focusName.current) {
      formRef.current
        ?.querySelector<HTMLInputElement>('[name="name"]')
        ?.focus();
      focusName.current = false;
    }
  }, [sent, error]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (busy || !form.reportValidity()) return;
    const values = new FormData(form);
    const optional = (name: string) =>
      String(values.get(name) ?? "").trim() || undefined;
    const body: components["schemas"]["ContactInput"] = {
      name: String(values.get("name") ?? "").trim(),
      email: String(values.get("email") ?? "").trim(),
      organisation: optional("organisation"),
      phone: optional("phone"),
      topic: String(
        values.get("topic"),
      ) as components["schemas"]["ContactInput"]["topic"],
      message: String(values.get("message") ?? "").trim(),
      privacyAccepted: true,
      website: optional("website"),
    };
    setBusy(true);
    setError("");
    try {
      readResponse(await api.POST("/contact", { body }));
      setReplyEmail(body.email);
      form.reset();
      setMessageLength(0);
      setSent(true);
    } catch (error) {
      setError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  if (sent)
    return (
      <section
        className="panel contact-form contact-success"
        id="contact-form"
        tabIndex={-1}
      >
        <div ref={feedback} tabIndex={-1} className="stack" role="status">
          <span className="contact-success-icon">
            <Check size={30} aria-hidden="true" />
          </span>
          <p className="eyebrow">MESSAGE SENT</p>
          <h2>Thank you for getting in touch.</h2>
          <p>
            We’ve sent your message to our team. We’ll reply to{" "}
            <strong>{replyEmail}</strong>.
          </p>
        </div>
        <button
          className="button outline"
          onClick={() => {
            focusName.current = true;
            setSent(false);
          }}
        >
          Send another message <ArrowRight size={17} aria-hidden="true" />
        </button>
      </section>
    );

  return (
    <section className="panel contact-form" id="contact-form" tabIndex={-1}>
      <div className="stack contact-form-intro">
        <p className="eyebrow">WE’RE LISTENING</p>
        <h2>Send us a message</h2>
        <p className="muted">
          Tell us how we can help. Fields marked * are required.
        </p>
      </div>
      <form ref={formRef} onSubmit={submit} aria-label="Contact the FEC team">
        <fieldset disabled={busy} className="contact-fields">
          <legend className="sr-only">Your contact details and message</legend>
          <div className="contact-form-row">
            <label>
              Full name *
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
              />
            </label>
            <label>
              <span>
                Organisation{" "}
                <span className="contact-optional">(optional)</span>
              </span>
              <input
                name="organisation"
                autoComplete="organization"
                maxLength={120}
              />
            </label>
          </div>
          <div className="contact-form-row">
            <label>
              Email address *
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </label>
            <label>
              <span>
                Phone number{" "}
                <span className="contact-optional">(optional)</span>
              </span>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={40}
                pattern="[+0-9\(\) .\-]{5,40}"
                title="Use digits, spaces, +, parentheses, dots or hyphens."
              />
            </label>
          </div>
          <label>
            What’s your message about? *
            <select name="topic" required defaultValue="">
              <option value="" disabled>
                Choose a topic
              </option>
              {topics.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Your message *
            <textarea
              name="message"
              required
              minLength={10}
              maxLength={5000}
              rows={6}
              aria-describedby="contact-message-hint contact-message-count"
              placeholder="Tell us about your enquiry or share your feedback…"
              onChange={(event) => setMessageLength(event.target.value.length)}
            />
          </label>
          <div className="contact-message-help">
            <p id="contact-message-hint">
              Please leave out medical records and other sensitive information.
            </p>
            <span id="contact-message-count">
              {messageLength.toLocaleString()} / 5,000
            </span>
          </div>
          <div className="contact-honeypot" aria-hidden="true">
            <label>
              Website
              <input
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                maxLength={200}
              />
            </label>
          </div>
          <label className="contact-consent">
            <input type="checkbox" name="privacyAccepted" required />
            <span>
              I agree that FEC may use these details to respond to my message.{" "}
              <Link to={siteHref("public", "/privacy")}>
                Privacy and confidentiality
              </Link>
            </span>
          </label>
          {error && (
            <div ref={feedback} tabIndex={-1} className="contact-error">
              <ErrorMessage>{error}</ErrorMessage>
              <p>
                You can also email{" "}
                <a href={"mailto:" + careEmail}>{careEmail}</a>.
              </p>
            </div>
          )}
          <button className="button primary" type="submit" disabled={busy}>
            {busy ? (
              <>
                <LoaderCircle
                  size={18}
                  className="contact-spinner"
                  aria-hidden="true"
                />{" "}
                Sending your message…
              </>
            ) : (
              <>
                Send message <ArrowRight size={18} aria-hidden="true" />
              </>
            )}
          </button>
          <p className="contact-form-footnote">
            {/* <ShieldCheck size={16} aria-hidden="true" />  */}
            Your message goes directly to our team.
          </p>
        </fieldset>
      </form>
    </section>
  );
}
