"use client";

import type { Role } from "@/features/auth/types";

/** Browser-side session storage per staff role + a small JSON fetch helper. */

interface StoredSession<P = unknown> {
  token: string;
  profile: P;
}

const key = (role: Role) => `mc.session.${role}`;
export const SESSION_EVENT = "mc-session";

export function readStoredSession<P = unknown>(role: Role): StoredSession<P> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(role));
    return raw ? (JSON.parse(raw) as StoredSession<P>) : null;
  } catch {
    return null;
  }
}

export function readStoredSessionRaw(role: Role): string {
  try {
    return localStorage.getItem(key(role)) ?? "";
  } catch {
    return "";
  }
}

export function saveSession(role: Role, s: StoredSession) {
  try {
    localStorage.setItem(key(role), JSON.stringify(s));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearSession(role: Role) {
  try {
    localStorage.removeItem(key(role));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, opts: { method?: string; body?: unknown; role?: Role } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  if (opts.role) {
    const s = readStoredSession(opts.role);
    if (s) headers.authorization = `Bearer ${s.token}`;
  }
  const res = await fetch(path, {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && opts.role) clearSession(opts.role);
    throw new ApiError((data as { error?: string }).error || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}
