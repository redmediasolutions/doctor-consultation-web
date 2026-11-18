/** Same lists and timings as the Flutter kiosk (lib/core/constants/app_constants.dart). */
export const COMMON_SYMPTOMS = [
  "Fever",
  "Cold & cough",
  "Sore throat",
  "Headache",
  "Body ache",
  "Stomach pain",
  "Acidity",
  "Loose motions",
  "Vomiting",
  "Skin rash",
  "Allergy",
  "Joint pain",
  "Back pain",
  "BP check",
  "Sugar / diabetes",
  "Eye irritation",
] as const;

export const DURATIONS = ["Today", "1–2 days", "3–5 days", "1 week", "More than a week"] as const;

/** Kiosk returns to the welcome screen this long after a consultation ends. */
export const KIOSK_RESET_SECONDS = 90;

/** An abandoned form resets after this much inactivity. */
export const KIOSK_IDLE_MS = 3 * 60 * 1000;

/** How often the kiosk checks its consultation (also tells the server the kiosk is still there). */
export const KIOSK_POLL_MS = 2500;

/** Doctors list refresh on the welcome / form screens. */
export const DOCTORS_POLL_MS = 10_000;
