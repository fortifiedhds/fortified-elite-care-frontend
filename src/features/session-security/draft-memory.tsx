import { createContext, useContext, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useLocation } from "react-router-dom";
export const DraftIdentity = createContext<string | undefined>(undefined);
const drafts = new Map<
  string,
  { revision: number | string; value: unknown; until: number }
>();
let cleanupTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleCleanup() {
  if (cleanupTimer || !drafts.size) return;
  const next = Math.min(...[...drafts.values()].map((d) => d.until));
  cleanupTimer = setTimeout(
    () => {
      cleanupTimer = undefined;
      for (const [key, draft] of drafts)
        if (draft.until <= Date.now()) drafts.delete(key);
      scheduleCleanup();
    },
    Math.max(1, next - Date.now()),
  );
  (cleanupTimer as unknown as { unref?: () => void }).unref?.();
}
export function clearMemoryDrafts() {
  drafts.clear();
  clearTimeout(cleanupTimer);
  cleanupTimer = undefined;
}
export function useMemoryDraft<T>(
  initial: T,
  revision: number | string,
  label: string,
) {
  const account = useContext(DraftIdentity),
    location = useLocation();
  const key = account
    ? account + ":" + location.pathname + ":" + label
    : undefined;
  function recover() {
    const cached = key ? drafts.get(key) : undefined;
    return cached && cached.until > Date.now() && cached.revision === revision
      ? (cached.value as T)
      : initial;
  }
  const [entry, setEntry] = useState(() => ({ key, value: recover() }));
  let value = entry.value;
  if (entry.key !== key) {
    value = recover();
    setEntry({ key, value });
  }
  const setValue: Dispatch<SetStateAction<T>> = (next) =>
    setEntry((previous) => ({
      key,
      value:
        typeof next === "function"
          ? (next as (value: T) => T)(
              previous.key === key ? previous.value : recover(),
            )
          : next,
    }));
  useEffect(() => {
    if (!key || entry.key !== key) return;
    for (const [k, v] of drafts) if (v.until < Date.now()) drafts.delete(k);
    if (drafts.size >= 100 && !drafts.has(key))
      drafts.delete(drafts.keys().next().value!);
    drafts.set(key, { revision, value, until: Date.now() + 30 * 60_000 });
    scheduleCleanup();
  }, [key, revision, value, entry.key]);
  return [value, setValue] as const;
}
