import { signInWithCustomToken } from "firebase/auth";

import { firebaseAuth } from "@/firebase/config";
import { authLog, maskToken } from "@/lib/auth-logger";
import { setToken } from "@/lib/session";

import { authRepository } from "../repository/auth.repository";
import type { SendOtpInput, SessionUser, VerifyOtpInput } from "../types";

/** "98450 12345" → "+919845012345" (the OTP function expects the full number). */
export function toE164(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return `+91${digits.replace(/^0/, "")}`;
}

export const authService = {
  async sendOtp(input: SendOtpInput) {
    const phoneNumber = toE164(input.phoneNumber.trim());
    if (phoneNumber.replace(/\D/g, "").length < 12) throw new Error("Enter a valid 10-digit mobile number.");

    authLog.step("1/5 SEND OTP", `Cloud function → MSG91 for ${phoneNumber}`);
    const response = await authRepository.sendOtp({ phoneNumber });
    authLog.ok("1/5 SEND OTP", `OTP sent. reqId=${response.reqId}`);
    return { ...response, phoneNumber };
  },

  async verifyOtp(input: VerifyOtpInput): Promise<SessionUser> {
    if (!input.otp.trim()) throw new Error("Enter the OTP.");
    if (!input.reqId) throw new Error("OTP request has expired. Please request a new OTP.");
    if (!firebaseAuth) {
      authLog.fail("CONFIG", "Firebase client is not configured — check NEXT_PUBLIC_FIREBASE_* in .env.local");
      throw new Error("Firebase is not configured.");
    }

    // 1. OTP → Firebase custom token
    authLog.step("2/5 VERIFY OTP", `Verifying OTP (reqId=${input.reqId})`);
    const response = await authRepository.verifyOtp({ ...input, otp: input.otp.trim() });
    authLog.ok("2/5 VERIFY OTP", `Custom token ${maskToken(response.token)}`);

    // 2. Custom token → Firebase session
    const credential = await signInWithCustomToken(firebaseAuth, response.token);
    authLog.ok("3/5 FIREBASE SIGN-IN", `uid=${credential.user.uid}`);

    // 3. Firebase ID token — THIS is what the Node backend expects
    setToken(await credential.user.getIdToken());

    // 4. Node backend decides who this is (admin / store staff / doctor)
    try {
      const user = await authRepository.me();
      authLog.ok("5/5 LOGIN COMPLETE", `Welcome ${user.fullName || user.phone}`);
      return user;
    } catch (error) {
      authLog.fail("4/5 BACKEND CHECK", "Blocked by backend — signing out", error);
      await this.logout();
      throw error;
    }
  },

  async logout() {
    if (firebaseAuth) await firebaseAuth.signOut();
    setToken(null);
  },
};
