/**
 * Console logger for the login / session flow. Filter the browser console by "AUTH".
 * On in development. In production builds set NEXT_PUBLIC_AUTH_DEBUG=true.
 */
const enabled = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_AUTH_DEBUG === "true";

const STYLE_INFO = "color:#2563eb;font-weight:600";
const STYLE_OK = "color:#16a34a;font-weight:600";
const STYLE_FAIL = "color:#dc2626;font-weight:600";

const stamp = () => new Date().toISOString().slice(11, 23);

/** Shorten a token so it can be logged without exposing it. */
export function maskToken(token: string | null | undefined) {
  if (!token) return "(none)";
  return `${token.slice(0, 12)}…${token.slice(-6)} (${token.length} chars)`;
}

export const authLog = {
  step(step: string, message: string, data?: unknown) {
    if (!enabled) return;
    console.log(`%c[AUTH ${stamp()}] ${step}%c ${message}`, STYLE_INFO, "", ...(data === undefined ? [] : [data]));
  },
  ok(step: string, message: string, data?: unknown) {
    if (!enabled) return;
    console.log(`%c[AUTH ${stamp()}] ✔ ${step}%c ${message}`, STYLE_OK, "", ...(data === undefined ? [] : [data]));
  },
  fail(step: string, message: string, error?: unknown) {
    if (!enabled) return;
    console.error(`%c[AUTH ${stamp()}] ✘ ${step}%c ${message}`, STYLE_FAIL, "", ...(error === undefined ? [] : [error]));
  },
};
