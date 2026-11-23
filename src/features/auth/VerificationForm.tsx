import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, messageFor, readResponse } from "../../shared/api/client";
import type { components } from "../../shared/api/schema";
import { ErrorMessage } from "../../shared/ui/Feedback";

export type Challenge = components["schemas"]["ChallengeView"];

export function VerificationForm({
  initial,
  verify,
  label = "Verify code",
  expiredMessage = "This code has expired. Start the request again.",
}: {
  initial: Challenge;
  verify: (code: string) => Promise<void>;
  label?: string;
  expiredMessage?: string;
}) {
  const [challenge, setChallenge] = useState(initial);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const cooldown = Math.max(
    0,
    Math.ceil((Date.parse(challenge.resendAt) - now) / 1000),
  );
  const expired = now >= Date.parse(challenge.expiresAt);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await verify(code);
    } catch (error) {
      setError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      setChallenge(readResponse(await api.POST("/auth/resend")));
      setCode("");
      setNotice("A new code has been sent.");
    } catch (error) {
      setError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="stack" onSubmit={submit}>
      <p>
        Enter the six-digit code sent to <strong>{challenge.email}</strong>.
      </p>
      <label>
        Verification code
        <input
          autoComplete="one-time-code"
          inputMode="numeric"
          pattern="[0-9]{6}"
          minLength={6}
          maxLength={6}
          required
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          autoFocus
          disabled={busy || expired}
        />
      </label>
      {expired && <p role="alert">{expiredMessage}</p>}
      <ErrorMessage>{error}</ErrorMessage>
      {notice && <p role="status">{notice}</p>}
      <div className="actions">
        <button className="button primary" disabled={busy || expired}>
          {busy ? "Verifying…" : label}
        </button>
        <button
          className="button outline"
          type="button"
          disabled={busy || expired || cooldown > 0}
          onClick={() => void resend()}
        >
          {cooldown ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}
