import { readSessionHeaders, sessionState } from "./session-state";
export function createSecureFetch(base: string): typeof fetch {
  return async (input, init) => {
    const request = input instanceof Request ? input : undefined;
    const method = (init?.method ?? request?.method ?? "GET").toUpperCase();
    let response: Response;
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
      const bootstrap = await fetch(base + "/auth/csrf", {
        credentials: "include",
        signal: init?.signal ?? request?.signal,
      });
      if (!bootstrap.ok) return bootstrap;
      const { token } = (await bootstrap.json()) as { token: string };
      const headers = new Headers(init?.headers ?? request?.headers);
      headers.set("X-CSRF-Token", token);
      const bootstrapId = bootstrap.headers.get("X-Request-ID");
      if (
        bootstrapId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          bootstrapId,
        )
      )
        headers.set("X-CSRF-Bootstrap-ID", bootstrapId);
      else headers.delete("X-CSRF-Bootstrap-ID");
      response = await fetch(
        request ? new Request(request, { ...init, headers }) : input,
        request ? undefined : { ...init, headers },
      );
    } else response = await fetch(input, init);
    readSessionHeaders(response);
    if (response.status === 401) {
      const error = (await response
        .clone()
        .json()
        .catch(() => null)) as { code?: string } | null;
      if (error?.code === "SESSION_EXPIRED")
        sessionState.set({ absolute: 0, idle: 0 });
    }
    return response;
  };
}
