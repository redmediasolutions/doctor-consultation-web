"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Polls `fetcher` every `intervalMs` while `enabled`. Pauses while the tab is hidden.
 * Returns the latest data plus a manual `refresh`.
 */
export function usePoll<T>(fetcher: () => Promise<T>, intervalMs: number, enabled = true) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const refresh = useCallback(async () => {
    try {
      const d = await fetcherRef.current();
      setData(d);
      setError(null);
      return d;
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (stopped) return;
      if (document.visibilityState !== "hidden") await refresh();
      if (!stopped) timer = setTimeout(tick, intervalMs);
    };
    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [enabled, intervalMs, refresh]);

  return { data, error, loading, refresh, setData };
}
