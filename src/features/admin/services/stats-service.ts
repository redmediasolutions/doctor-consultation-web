import "server-only";

import { listConsultations } from "@/features/consultations/services/consultation-service";
import { countPrescriptionsToday } from "@/features/prescriptions/services/prescription-service";
import type { AdminStats } from "../types";
import { listDoctorsRaw, listStoresRaw, publicDoctor } from "./directory-service";

const minutes = (a: string, b: string) => Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 60000);
const avg = (a: number[]) => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10 : 0);

export async function getAdminStats(): Promise<AdminStats> {
  const [today, stores, doctorsRaw, prescriptions] = await Promise.all([
    listConsultations({ today: true }),
    listStoresRaw(),
    listDoctorsRaw(),
    countPrescriptionsToday(),
  ]);
  const doctors = doctorsRaw.map(publicDoctor);
  const completed = today.filter((c) => c.status === "completed");

  return {
    today: {
      total: today.length,
      completed: completed.length,
      cancelled: today.filter((c) => c.status === "cancelled").length,
      waiting: today.filter((c) => c.status === "waiting").length,
      inCall: today.filter((c) => c.status === "in_call").length,
      prescriptions,
      avgWaitMin: avg(today.filter((c) => c.acceptedAt).map((c) => minutes(c.createdAt, c.acceptedAt!))),
      avgCallMin: avg(completed.filter((c) => c.acceptedAt && c.endedAt).map((c) => minutes(c.acceptedAt!, c.endedAt!))),
      consultationFees: completed.reduce((s, c) => s + (doctorsRaw.find((d) => d.id === c.doctorId)?.fee ?? 0), 0),
    },
    doctorsOnline: doctors.filter((d) => d.status !== "offline").length,
    doctorsTotal: doctors.length,
    byStore: stores.map((s) => {
      const sc = today.filter((c) => c.storeId === s.id);
      return {
        storeId: s.id,
        name: s.name,
        city: s.city,
        total: sc.length,
        completed: sc.filter((c) => c.status === "completed").length,
        waiting: sc.filter((c) => c.status === "waiting").length,
      };
    }),
  };
}
