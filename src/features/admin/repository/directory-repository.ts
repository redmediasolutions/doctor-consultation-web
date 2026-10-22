"use client";

import { api } from "@/lib/api-client";
import type { AdminStats, PublicDoctor, PublicStore } from "../types";

export const fetchStores = () => api<PublicStore[]>("/api/stores");
export const fetchDoctors = () => api<PublicDoctor[]>("/api/doctors");
export const fetchAdminStats = () => api<AdminStats>("/api/admin/stats", { role: "admin" });
export const addDoctor = (data: Record<string, unknown>) => api<PublicDoctor>("/api/doctors", { role: "admin", body: data });
export const addStore = (data: Record<string, unknown>) => api<PublicStore>("/api/stores", { role: "admin", body: data });
export const resetDemoData = () => api("/api/admin/reset", { role: "admin", body: {} });
