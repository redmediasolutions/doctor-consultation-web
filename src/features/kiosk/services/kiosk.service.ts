import { SPECIALTIES } from "@/lib/config";
import type { KioskForm, NewConsultationInput } from "../types";

export const emptyKioskForm = (): KioskForm => ({
  name: "",
  age: "",
  gender: "",
  phone: "",
  symptoms: [],
  complaint: "",
  duration: "",
  allergies: "",
  vitals: { bp: "", pulse: "", temperature: "", spo2: "", weight: "" },
  specialty: SPECIALTIES[0],
  consent: false,
});

const digits = (s: string) => s.replace(/\D/g, "");

/** Same rules as the Flutter kiosk. */
export const kioskService = {
  phoneDigits: (f: KioskForm) => digits(f.phone),

  detailsValid(f: KioskForm) {
    const age = Number(f.age);
    return (
      f.name.trim().length >= 2 &&
      f.age.trim() !== "" &&
      Number.isInteger(age) &&
      age >= 0 &&
      age <= 120 &&
      f.gender !== "" &&
      digits(f.phone).length === 10
    );
  },

  symptomsValid: (f: KioskForm) => f.symptoms.length > 0 || f.complaint.trim().length >= 3,

  concern: (f: KioskForm) => [f.symptoms.join(", "), f.complaint.trim()].filter(Boolean).join(" — "),

  toInput(storeId: string, f: KioskForm): NewConsultationInput {
    return {
      storeId,
      patient: {
        name: f.name.trim(),
        age: Number(f.age),
        gender: f.gender || "Other",
        phone: digits(f.phone),
      },
      symptoms: f.symptoms,
      complaint: f.complaint.trim(),
      duration: f.duration,
      allergies: f.allergies.trim(),
      vitals: {
        bp: f.vitals.bp.trim(),
        pulse: f.vitals.pulse.trim(),
        temperature: f.vitals.temperature.trim(),
        spo2: f.vitals.spo2.trim(),
        weight: f.vitals.weight.trim(),
      },
      specialty: f.specialty,
      consent: true,
    };
  },
};
