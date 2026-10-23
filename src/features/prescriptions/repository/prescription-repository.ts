"use client";

import { api } from "@/lib/api";
import type { PrescriptionWithRefs } from "../types";

/** Staff → their store only (enforced by the server). Admin may pass a storeId. */
export const listPrescriptions = (opts: { today?: boolean; storeId?: string } = {}) =>
  api.get<PrescriptionWithRefs[]>("/prescriptions", { today: opts.today === false ? "" : "1", storeId: opts.storeId });

export const getPrescription = (id: string) => api.get<PrescriptionWithRefs>(`/prescriptions/${id}`);

export const setDispensed = (id: string, dispensed: boolean) =>
  api.patch<PrescriptionWithRefs>(`/prescriptions/${id}`, { dispensed });
