"use client";

import { api } from "@/lib/api";
import type { AdminStats, PublicDoctor, PublicStore } from "../types";

/** Stores come from the shared billing `stores` table (managed in the Gladskin admin app). */
export const fetchStores = () => api.get<PublicStore[]>("/stores");
export const fetchDoctors = () => api.get<PublicDoctor[]>("/doctors");
export const fetchAdminStats = () => api.get<AdminStats>("/admin/stats");
export const addDoctor = (data: Record<string, unknown>) => api.post<PublicDoctor>("/doctors", data);
export const updateDoctor = (id: string, data: Record<string, unknown>) => api.patch<PublicDoctor>(`/doctors/${id}`, data);
