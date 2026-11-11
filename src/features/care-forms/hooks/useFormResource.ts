import { useCallback, useEffect, useState } from "react";
import { api, messageFor, readResponse } from "../../../shared/api/client";
import type { Kind, Load } from "../types";

export function useLoad<T>(load: Load<T>) {
  const [state, setState] = useState<{ data?: T; error?: string }>({});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const ctl = new AbortController();
    void load(ctl.signal)
      .then((data) => {
        if (!ctl.signal.aborted) setState({ data });
      })
      .catch((error) => {
        if (!ctl.signal.aborted) setState({ error: messageFor(error) });
      });
    return () => ctl.abort();
  }, [load, attempt]);
  return {
    ...state,
    reload: () => {
      setState({});
      setAttempt((n) => n + 1);
    },
  };
}

export function useDefinition(kind: Kind) {
  return useLoad(
    useCallback(
      async (signal) =>
        readResponse(
          await api.GET("/forms/{kind}/definition", {
            params: { path: { kind } },
            signal,
          }),
        ),
      [kind],
    ),
  );
}

export function useDefinitionForDoctor() {
  return useDefinition("BASELINE_SELF");
}
