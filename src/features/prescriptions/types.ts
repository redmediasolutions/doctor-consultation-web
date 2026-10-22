import type { PublicDoctor, PublicStore } from "@/features/admin/types";
import type { Patient } from "@/features/consultations/types";

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration: string;
  quantity: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  rxNo: string;
  token: string;
  consultationId: string;
  doctorId: string;
  storeId: string;
  patient: Patient;
  diagnosis: string;
  chiefComplaint: string;
  medicines: Medicine[];
  investigations: string;
  advice: string;
  followUp: string;
  createdAt: string;
  dispensed: boolean;
  dispensedAt?: string;
}

export interface PrescriptionWithRefs extends Prescription {
  doctor?: PublicDoctor;
  store?: PublicStore;
}

/** What the doctor submits from the prescription pad. */
export interface PrescriptionDraft {
  diagnosis: string;
  chiefComplaint: string;
  medicines: Medicine[];
  investigations: string;
  advice: string;
  followUp: string;
}
