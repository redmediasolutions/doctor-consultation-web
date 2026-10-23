import type { PublicDoctor, PublicStore } from "@/features/admin/types";

/**
 * Who is signed in (decided by the Node backend, GET /api/tele/auth/me):
 *   admin  → MariaDB users.role = admin  → owner dashboard (and any store's counter)
 *   staff  → store_manager / billing_staff → pharmacy counter of their store
 *   doctor → tele_doctors row             → doctor console
 */
export type UserKind = "admin" | "staff" | "doctor";

export type SessionUser = {
  uid: string;
  kind: UserKind;
  /** Raw role: admin | store_manager | billing_staff | doctor */
  role: string;
  fullName: string;
  phone: string;
  email: string;
  storeId: string | null;
  doctorId: string | null;
  store?: PublicStore;
  doctor?: PublicDoctor;
};

export type SendOtpInput = { phoneNumber: string };
export type SendOtpResponse = { success: boolean; reqId: string };

export type VerifyOtpInput = { phoneNumber: string; otp: string; reqId: string };
export type VerifyOtpResponse = { success: boolean; token: string; isNewUser: boolean };
