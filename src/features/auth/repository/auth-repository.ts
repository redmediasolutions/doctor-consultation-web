"use client";

import { api, clearSession, saveSession } from "@/lib/api-client";
import type { LoginResult, Role } from "../types";

export async function login<P>(role: Role, pin: string, id?: string): Promise<P> {
  const res = await api<LoginResult<P>>("/api/auth/login", { body: { role, id, pin } });
  saveSession(role, res);
  return res.profile;
}

export async function logout(role: Role) {
  if (role === "doctor") {
    await api("/api/doctors/heartbeat", { role, body: { status: "offline" } }).catch(() => undefined);
  }
  clearSession(role);
}
