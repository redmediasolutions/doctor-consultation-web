"use client";

import { useMemo, useSyncExternalStore } from "react";

import type { Role } from "@/features/auth/types";
import { readStoredSessionRaw, SESSION_EVENT } from "@/lib/api-client";

function subscribe(cb: () => void) {
  window.addEventListener(SESSION_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(SESSION_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * Reactive staff session for a role. `ready` is false during server render / hydration,
 * so pages don't flash the login screen.
 */
export function useSession<P>(role: Role): { ready: boolean; profile: P | null } {
  const raw = useSyncExternalStore(
    subscribe,
    () => readStoredSessionRaw(role),
    () => undefined,
  );
  return useMemo(() => {
    if (raw === undefined) return { ready: false, profile: null };
    try {
      return { ready: true, profile: raw ? (JSON.parse(raw) as { profile: P }).profile : null };
    } catch {
      return { ready: true, profile: null };
    }
  }, [raw]);
}
