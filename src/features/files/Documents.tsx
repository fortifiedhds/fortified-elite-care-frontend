import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  api,
  apiBase,
  messageFor,
  readResponse,
} from "../../shared/api/client";
import type { components } from "../../shared/api/schema";
import { ErrorMessage } from "../../shared/ui/Feedback";

export function Documents() {
  const [files, setFiles] = useState<components["schemas"]["FileView"][]>();
  const [file, setFile] = useState<File>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void api
      .GET("/files", { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setFiles(readResponse(result));
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(messageFor(error));
      });
    return () => controller.abort();
  }, []);
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Choose a file up to 10 MB.");
      return;
    }
    const form = event.currentTarget;
    const body = new FormData();
    body.append("file", file);
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(apiBase + "/files", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = await response.json();
      readResponse({ response, ...(response.ok ? { data } : { error: data }) });
      setFiles(readResponse(await api.GET("/files")));
      setFile(undefined);
      form.reset();
      setNotice("Your document is uploaded.");
    } catch (error) {
      setError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>Your private documents</h2>
      <p>
        Upload PDFs, JPEGs or PNGs up to 10 MB. These documents are available to
        your account.
      </p>
      <ErrorMessage>{error}</ErrorMessage>
      {notice && <p role="status">{notice}</p>}
      <form className="stack" onSubmit={upload}>
        <label>
          Choose a document
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            required
            onChange={(event) => setFile(event.target.files?.[0])}
          />
        </label>
        <button className="button primary" disabled={busy || !file}>
          {busy ? "Uploading…" : "Upload document"}
        </button>
      </form>
      {files?.length ? (
        <ul className="document-list">
          {files.map((item) => (
            <li key={item.id}>
              <a href={apiBase + "/files/" + item.id + "/download"}>
                {item.name}
              </a>
              <span className="muted">
                {(item.bytes / 1024).toFixed(0)} KB ·{" "}
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        files && <p>Your uploaded documents will appear here.</p>
      )}
    </section>
  );
}
