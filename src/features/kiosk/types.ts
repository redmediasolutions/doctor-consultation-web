import type { Patient, Vitals } from "@/features/consultations/types";

/** welcome → details → symptoms → review (camera + consent) → waiting → call → done (same as the Flutter kiosk). */
export type KioskStep = "welcome" | "details" | "symptoms" | "review" | "waiting" | "call" | "done";

/** What the patient types on the kiosk. */
export interface KioskForm {
  name: string;
  age: string;
  gender: Patient["gender"] | "";
  phone: string;
  symptoms: string[];
  complaint: string;
  duration: string;
  allergies: string;
  vitals: Required<Vitals>;
  specialty: string;
  consent: boolean;
}

/** POST /api/tele/consultations body. */
export interface NewConsultationInput {
  storeId: string;
  patient: Patient;
  symptoms: string[];
  complaint: string;
  duration: string;
  allergies: string;
  vitals: Vitals;
  specialty: string;
  consent: true;
}
