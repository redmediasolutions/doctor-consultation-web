import "server-only";
import crypto from "node:crypto";

import { env } from "@/lib/server/env";
import { HttpError } from "@/lib/server/http";
import type { Role, Session } from "../types";

/**
 * HMAC-signed staff sessions: "<role>.<subject>.<expiry>.<signature>".
 * Accepted as `Authorization: Bearer <token>` (Flutter app) or `x-auth: <token>` (web).
 */
const TTL_MS = 1000 * 60 * 60 * 14; // one long shift
const ROLES: Role[] = ["doctor", "staff", "admin"];

const sign = (payload: string) => crypto.createHmac("sha256", env.sessionSecret).update(payload).digest("base64url");

export function issueToken(role: Role, subject: string) {
  const payload = `${role}.${subject}.${Date.now() + TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

export function readSession(req: Request): Session | null {
  const authz = req.headers.get("authorization") || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : req.headers.get("x-auth") || "";
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [role, subject, exp, sig] = parts;
  const expected = Buffer.from(sign(`${role}.${subject}.${exp}`));
  const given = Buffer.from(sig);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  if (Number(exp) < Date.now() || !ROLES.includes(role as Role)) return null;
  return { role: role as Role, subject };
}

/** Returns the session or throws 401. */
export function requireRole(req: Request, ...roles: Role[]): Session {
  const s = readSession(req);
  if (!s || !roles.includes(s.role)) throw new HttpError("Unauthorised", 401);
  return s;
}
