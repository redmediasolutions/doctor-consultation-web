"use client";

import type { PrescriptionDraft, PrescriptionWithRefs } from "@/features/prescriptions/types";
import { api } from "@/lib/api";
import type { ConsultationWithRefs, RtcCredentials } from "../types";

/** ?status=waiting|in_call|completed|cancelled|active &doctorId=me &today=1 &storeId= */
export const listConsultations = (query: Record<string, string> = {}) =>
  api.get<ConsultationWithRefs[]>("/consultations", query);

export const getConsultation = (id: string) => api.get<ConsultationWithRefs>(`/consultations/${id}`);

export const acceptConsultation = (id: string) =>
  api.patch<ConsultationWithRefs>(`/consultations/${id}`, { action: "accept" });

export const endConsultation = (id: string) => api.patch<ConsultationWithRefs>(`/consultations/${id}`, { action: "end" });

export const doctorRtcCredentials = (id: string) => api.get<RtcCredentials>(`/consultations/${id}/rtc`, { as: "doctor" });

export const issuePrescription = (id: string, draft: PrescriptionDraft) =>
  api.post<PrescriptionWithRefs>(`/consultations/${id}/prescription`, draft);

export const sendHeartbeat = (status: "online" | "busy" | "offline") => api.post("/doctors/heartbeat", { status });
