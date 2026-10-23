/**
 * Single entry point for every backend call (same client as the Gladskin admin app).
 *
 * Talks to the Gladskin Node.js API → MedConnect routes under /api/tele.
 * Sends `Authorization: Bearer <Firebase ID token>`; on a 401 it gets a fresh token and retries once.
 */
import { getFreshToken, notifySessionExpired } from "@/lib/session";

/** e.g. https://api-12v1.gladskin.in/api */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-12v1.gladskin.in/api").replace(/\/$/, "");

/** MedConnect routes live under /api/tele on the shared backend. */
const TELE_BASE_URL = `${API_BASE_URL}/tele`;

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status = 400, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export type Query = Record<string, string | number | boolean | null | undefined>;

type RequestOptions = { query?: Query; body?: unknown; signal?: AbortSignal; keepalive?: boolean };

function buildQuery(query?: Query) {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const send = (token: string | null) =>
    fetch(`${TELE_BASE_URL}${path}${buildQuery(options.query)}`, {
      method,
      signal: options.signal,
      keepalive: options.keepalive,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

  const res = await withFreshToken(send);
  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "message" in data && String((data as { message: unknown }).message)) ||
      res.statusText ||
      "Request failed";
    throw new ApiError(message, res.status, data);
  }
  // Accept both `{ success, data }` envelopes and bare payloads.
  if (data && typeof data === "object" && "data" in data && Object.keys(data).length <= 3) {
    return (data as { data: T }).data;
  }
  return data as T;
}

/**
 * Sends the request with a current Firebase token. If the server still says 401 (expired / revoked),
 * get a brand-new token and try once more. If that also fails, the login is over → tell AuthProvider.
 */
async function withFreshToken(send: (token: string | null) => Promise<Response>): Promise<Response> {
  let token = await getFreshToken();
  let res: Response;
  try {
    res = await send(token);
    if (res.status === 401 && token) {
      token = await getFreshToken(true);
      res = await send(token);
      if (res.status === 401) notifySessionExpired();
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("Can't reach the server. Check your connection.", 0);
  }
  return res;
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>("GET", path, { query, signal }),
  post: <T>(path: string, body?: unknown, opts?: { keepalive?: boolean }) =>
    request<T>("POST", path, { body, keepalive: opts?.keepalive }),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, { body }),
};

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
