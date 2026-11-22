type SessionTimes = { absolute: number; idle: number };
let state: SessionTimes | null = null;
const listeners = new Set<() => void>();
export const sessionState = {
  get: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  set: (next: SessionTimes | null) => {
    state = next;
    for (const listener of listeners) listener();
  },
};
export function readSessionHeaders(response: Response) {
  const absolute = Date.parse(
    response.headers.get("X-Session-Expires-At") ?? "",
  );
  const idle = Date.parse(
    response.headers.get("X-Session-Idle-Expires-At") ?? "",
  );
  if (Number.isFinite(absolute) && Number.isFinite(idle))
    sessionState.set({
      absolute,
      idle: state?.absolute === absolute ? Math.max(state.idle, idle) : idle,
    });
}
