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
