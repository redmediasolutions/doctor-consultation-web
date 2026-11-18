"use client";

import type { PublicDoctor } from "@/features/admin/types";
import type { ConsultationWithRefs, RtcCredentials } from "@/features/consultations/types";
import type { PrescriptionWithRefs } from "@/features/prescriptions/types";
import { api, API_BASE_URL } from "@/lib/api";
import { getToken } from "@/lib/session";
import type { NewConsultationInput } from "../types";

/** Kiosk calls (store staff / owner login). Same endpoints as the Flutter kiosk. */
export const kioskRepository = {
  doctors: () => api.get<PublicDoctor[]>("/doctors"),

  create: (input: NewConsultationInput) => api.post<ConsultationWithRefs>("/consultations", input),

  /** Also tells the server the kiosk is still there (polled every few seconds). */
  get: (id: string) => api.get<ConsultationWithRefs>(`/consultations/${id}`),

  cancel: (id: string, reason: string) => api.patch<ConsultationWithRefs>(`/consultations/${id}`, { action: "cancel", reason }),

  patientRtc: (id: string) => api.get<RtcCredentials>(`/consultations/${id}/rtc`, { as: "patient" }),

  prescription: (id: string) => api.get<PrescriptionWithRefs>(`/prescriptions/${id}`),

  /**
   * Best-effort cancel while the tab is closing (no awaiting possible there).
   * If it doesn't get through, the server drops the request on its own after 2 minutes.
   */
  cancelOnUnload(id: string, reason: string) {
    const token = getToken();
    if (!token) return;
    try {
      void fetch(`${API_BASE_URL}/tele/consultations/${id}`, {
        method: "PATCH",
        keepalive: true,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "cancel", reason }),
      }).catch(() => undefined);
    } catch {
      /* page is going away */
    }
  },
};
