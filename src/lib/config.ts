/**
 * Public settings (safe in the browser). Server secrets live in src/lib/server/env.ts.
 */
export const BRAND = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "MedConnect",
  chain: process.env.NEXT_PUBLIC_CHAIN_NAME || "MedConnect Pharmacy",
  tagline: "Instant doctor consultations at your neighbourhood pharmacy",
};

/** Agora App ID is not a secret (the certificate is). Same value as in the Flutter app. */
export const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "91a5d012fb4b490b94732cf3b1371a95";

/** Fixed Agora uids inside a consultation channel — must match the Flutter app. */
export const RTC_UID = { patient: 1001, doctor: 2001 } as const;

export const SPECIALTIES = [
  "General Physician",
  "Paediatrics",
  "Dermatology",
  "Gynaecology",
  "ENT",
  "Orthopaedics",
] as const;

/** Doctors who haven't pinged for this long show as offline. */
export const DOCTOR_HEARTBEAT_TIMEOUT_MS = 45_000;
