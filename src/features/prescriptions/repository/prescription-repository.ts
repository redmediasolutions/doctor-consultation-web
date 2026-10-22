"use client";

import type { Role } from "@/features/auth/types";
import { api } from "@/lib/api-client";
import type { PrescriptionWithRefs } from "../types";

export const listPrescriptions = (role: Role, today = true) =>
  api<PrescriptionWithRefs[]>(`/api/prescriptions${today ? "?today=1" : ""}`, { role });

export const setDispensed = (id: string, dispensed: boolean) =>
  api<PrescriptionWithRefs>(`/api/prescriptions/${id}`, { method: "PATCH", role: "staff", body: { dispensed } });
