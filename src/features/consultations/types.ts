import type { PublicDoctor, PublicStore } from "@/features/admin/types";

export type ConsultationStatus = "waiting" | "in_call" | "completed" | "cancelled";

export interface Patient {
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone: string;
}

export interface Vitals {
  bp?: string;
  pulse?: string;
  temperature?: string;
  spo2?: string;
  weight?: string;
}

export interface Consultation {
  id: string;
  /** Short number shown to the patient, e.g. "T014". */
  token: string;
  storeId: string;
  patient: Patient;
  symptoms: string[];
  complaint: string;
  duration: string;
  allergies: string;
  vitals: Vitals;
  specialty: string;
  status: ConsultationStatus;
  doctorId?: string;
  prescriptionId?: string;
  createdAt: string;
  acceptedAt?: string;
  endedAt?: string;
  cancelReason?: string;
}

export interface ConsultationWithRefs extends Consultation {
  doctor?: PublicDoctor;
  store?: PublicStore;
  waitingAhead?: number;
}

/** Agora credentials for one participant of one consultation channel. */
export interface RtcCredentials {
  appId: string;
  channelName: string;
  uid: number;
  token: string;
  expiresAt: string;
}

/** In-call chat message, sent over the Agora data stream (same format as the Flutter app). */
export interface ChatMessage {
  from: "doctor" | "patient";
  text: string;
  at: string;
}
