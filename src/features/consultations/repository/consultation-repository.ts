"use client";

import type { Role } from "@/features/auth/types";
import type { PrescriptionDraft, PrescriptionWithRefs } from "@/features/prescriptions/types";
import { api } from "@/lib/api-client";
import type { ConsultationWithRefs, RtcCredentials } from "../types";

export function listConsultations(role: Role, query: Record<string, string> = {}) {
  const qs = new URLSearchParams(query).toString();
  return api<ConsultationWithRefs[]>(`/api/consultations${qs ? `?${qs}` : ""}`, { role });
}

export const getConsultation = (id: string) => api<ConsultationWithRefs>(`/api/consultations/${id}`);

export const acceptConsultation = (id: string) =>
  api<ConsultationWithRefs>(`/api/consultations/${id}`, { method: "PATCH", role: "doctor", body: { action: "accept" } });

export const endConsultation = (id: string) =>
  api<ConsultationWithRefs>(`/api/consultations/${id}`, { method: "PATCH", role: "doctor", body: { action: "end" } });

export const doctorRtcCredentials = (id: string) =>
  api<RtcCredentials>(`/api/consultations/${id}/rtc?as=doctor`, { role: "doctor" });

export const issuePrescription = (id: string, draft: PrescriptionDraft) =>
  api<PrescriptionWithRefs>(`/api/consultations/${id}/prescription`, { role: "doctor", body: draft });

export const sendHeartbeat = (status: "online" | "busy" | "offline") =>
  api("/api/doctors/heartbeat", { role: "doctor", body: { status } });
