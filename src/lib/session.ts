import { firebaseAuth } from "@/firebase/config";

const TOKEN_KEY = "mc.session.token";

/** Fired when the login can't be renewed — AuthProvider logs the user out. */
export const SESSION_EXPIRED_EVENT = "mc:session-expired";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

/**
 * Token to send to the backend.
 *
 * Firebase ID tokens expire after 1 hour. Firebase keeps the signed-in user (in IndexedDB) and
 * `getIdToken()` returns a fresh token when the old one is about to expire, so we always ask
 * Firebase instead of re-using the token saved at login. `forceRefresh` = brand-new token (after a 401).
 */
export async function getFreshToken(forceRefresh = false): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!firebaseAuth) return getToken();

  try {
    await firebaseAuth.authStateReady();
    const user = firebaseAuth.currentUser;
    if (!user) return getToken();

    const token = await user.getIdToken(forceRefresh);
    if (token !== getToken()) setToken(token);
    return token;
  } catch {
    return getToken();
  }
}

export function notifySessionExpired() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
