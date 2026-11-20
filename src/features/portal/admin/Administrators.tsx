import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, messageFor, readResponse } from "../../../shared/api/client";
import type { components } from "../../../shared/api/schema";
import { ErrorMessage } from "../../../shared/ui/Feedback";
import { VerificationForm } from "../../auth/VerificationForm";
import type { Challenge } from "../../auth/VerificationForm";
import { permissionLabels } from "../permissions";

type Admin = components["schemas"]["AdminView"];
type Permission = components["schemas"]["AdminPermission"];

export function Administrators({
  refresh,
}: {
  refresh: () => Promise<unknown>;
}) {
  const [accounts, setAccounts] = useState<Admin[]>([]);
  const [target, setTarget] = useState<Admin>();
  const [selected, setSelected] = useState<Permission[]>([]);
  const [challenge, setChallenge] = useState<Challenge>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function load() {
    setAccounts(readResponse(await api.GET("/admin/accounts")));
  }
  useEffect(() => {
    void load().catch((error) => setError(messageFor(error)));
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const data = new FormData(event.currentTarget);
    try {
      const result = target
        ? await api.POST("/admin/accounts/permissions", {
            body: { id: target.id, permissions: selected },
          })
        : await api.POST("/admin/accounts", {
            body: {
              name: String(data.get("name")),
              email: String(data.get("email")),
              password: String(data.get("password")),
              permissions: selected,
            },
          });
      setChallenge(readResponse(result));
    } catch (error) {
      setError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="stack">
      <section className="panel">
        <p>
          Create separate administrator accounts and choose the actions each one
          can perform.
        </p>
        {accounts.map((account) => (
          <article className="record" key={account.id}>
            <div>
              <h3>{account.name}</h3>
              <p>{account.email}</p>
              <p className="muted">
                {account.adminPermissions
                  .map((permission) => permissionLabels[permission])
                  .join(", ") || "No administrative permissions assigned"}
              </p>
            </div>
            <button
              className="button outline small"
              disabled={busy || Boolean(challenge)}
              onClick={() => {
                setTarget(account);
                setSelected(account.adminPermissions);
                setError("");
                setNotice("");
              }}
            >
              Edit permissions for {account.name}
            </button>
          </article>
        ))}
      </section>
      <section className="panel">
        <h2>
          {target ? "Edit administrator permissions" : "Create administrator"}
        </h2>
        <ErrorMessage>{error}</ErrorMessage>
        {notice && <p role="status">{notice}</p>}
        {challenge ? (
          <>
            <VerificationForm
              initial={challenge}
              label="Confirm administrator change"
              verify={async (code) => {
                readResponse(
                  await api.POST("/admin/accounts/confirm", { body: { code } }),
                );
                setChallenge(undefined);
                setTarget(undefined);
                setSelected([]);
                setNotice("Administrator access has been saved.");
                await refresh();
                await load();
              }}
            />
            <button
              className="button outline"
              onClick={() => setChallenge(undefined)}
            >
              Cancel administrator change
            </button>
          </>
        ) : (
          <form className="stack" onSubmit={submit}>
            {target ? (
              <p>
                Changing permissions for <strong>{target.name}</strong>.
              </p>
            ) : (
              <>
                <label>
                  Administrator name
                  <input name="name" required minLength={2} maxLength={100} />
                </label>
                <label>
                  Administrator email
                  <input name="email" type="email" required maxLength={254} />
                </label>
                <label>
                  Initial password
                  <input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={12}
                    maxLength={128}
                  />
                </label>
                <p className="muted">
                  Share the initial password securely with the administrator.
                  Their email code is required at sign-in.
                </p>
              </>
            )}
            <fieldset className="permission-options">
              <legend>Permissions</legend>
              {(Object.keys(permissionLabels) as Permission[]).map(
                (permission) => (
                  <label key={permission}>
                    <input
                      type="checkbox"
                      checked={selected.includes(permission)}
                      onChange={(event) =>
                        setSelected((previous) =>
                          event.target.checked
                            ? [...previous, permission]
                            : previous.filter((item) => item !== permission),
                        )
                      }
                    />
                    {permissionLabels[permission]}
                  </label>
                ),
              )}
            </fieldset>
            <div className="actions">
              <button className="button primary" disabled={busy}>
                {busy ? "Sending code…" : "Send verification code"}
              </button>
              {target && (
                <button
                  type="button"
                  className="button outline"
                  onClick={() => {
                    setTarget(undefined);
                    setSelected([]);
                  }}
                >
                  Create a new administrator
                </button>
              )}
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
