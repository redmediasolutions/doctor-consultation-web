import { api } from "@/lib/api";
import { authLog } from "@/lib/auth-logger";

import type { SendOtpInput, SendOtpResponse, SessionUser, VerifyOtpInput, VerifyOtpResponse } from "../types";

/** Same MSG91 OTP cloud functions as the Gladskin admin app. */
const sendOtpUrl = process.env.NEXT_PUBLIC_FIREBASE_OTP_SEND_URL || "https://sendgladskinotp-zkhqe3r4ta-uc.a.run.app";
const verifyOtpUrl =
  process.env.NEXT_PUBLIC_FIREBASE_OTP_VERIFY_URL || "https://verifygladskinotp-zkhqe3r4ta-uc.a.run.app";

async function postFirebaseFunction<T>(url: string, body: unknown, defaultMessage: string): Promise<T> {
  if (!url) throw new Error("Firebase OTP URL is not configured.");

  authLog.step("HTTP", `POST ${url}`);
  let response: Response;
  try {
    response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch (error) {
    authLog.fail("HTTP", `Network error calling ${url}`, error);
    throw new Error("Unable to connect to the authentication service.");
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch (error) {
    authLog.fail("HTTP", "Response was not valid JSON", error);
    throw new Error(defaultMessage);
  }

  if (!response.ok || !data || typeof data !== "object" || !("success" in data) || data.success !== true) {
    const d = data as { message?: unknown; error?: unknown } | null;
    const message = typeof d?.message === "string" ? d.message : typeof d?.error === "string" ? d.error : defaultMessage;
    authLog.fail("HTTP", `Cloud function rejected the request: ${message}`, data);
    throw new Error(message);
  }
  return data as T;
}

export const authRepository = {
  sendOtp: (input: SendOtpInput) => postFirebaseFunction<SendOtpResponse>(sendOtpUrl, input, "Failed to send OTP."),

  /** Returns a Firebase CUSTOM token; the auth service exchanges it for an ID token. */
  verifyOtp: (input: VerifyOtpInput) => postFirebaseFunction<VerifyOtpResponse>(verifyOtpUrl, input, "Invalid OTP."),

  /** Node checks: Firebase token → MariaDB users (admin / store staff) or tele_doctors. */
  async me(): Promise<SessionUser> {
    authLog.step("ME", "GET /tele/auth/me (Node: Firebase token → MariaDB users / tele_doctors)");
    const response = await api.get<{ user?: SessionUser } & Partial<SessionUser>>("/auth/me");
    const user = (response.user ?? response) as SessionUser;
    if (!user?.uid || !user.kind) throw new Error("Invalid user response from server.");
    authLog.ok("ME", `Signed in as ${user.kind} (${user.role})`, user);
    return user;
  },

  /** Doctor goes offline on sign-out. */
  goOffline: () => api.post("/doctors/heartbeat", { status: "offline" }, { keepalive: true }).catch(() => undefined),
};
