import "server-only";

import { loadRefs, type Refs } from "@/features/admin/services/directory-service";
import { lockConsultation, saveConsultation } from "@/features/consultations/services/consultation-service";
import { getDb, newId, nextCounter, todaySql } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { HttpError, str } from "@/lib/server/http";
import type { Medicine, Prescription, PrescriptionWithRefs } from "../types";

export function rxWithRefs(p: Prescription, refs: Refs): PrescriptionWithRefs {
  return { ...p, doctor: refs.doctors.get(p.doctorId), store: refs.stores.get(p.storeId) };
}

export async function getPrescription(id: string): Promise<PrescriptionWithRefs | null> {
  const db = await getDb();
  const rows = await db.query<{ data: Prescription }>("select data from mc_prescriptions where id = $1", [id]);
  return rows[0] ? rxWithRefs(rows[0].data, await loadRefs()) : null;
}

export async function listPrescriptions(filter: {
  storeId?: string | null;
  doctorId?: string | null;
  today?: boolean;
  pending?: boolean;
}): Promise<PrescriptionWithRefs[]> {
  const db = await getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.storeId) {
    params.push(filter.storeId);
    where.push(`store_id = $${params.length}`);
  }
  if (filter.doctorId) {
    params.push(filter.doctorId);
    where.push(`doctor_id = $${params.length}`);
  }
  if (filter.pending) where.push("dispensed = false");
  if (filter.today) {
    params.push(env.timeZone);
    where.push(todaySql("created_at", params.length));
  }
  const rows = await db.query<{ data: Prescription }>(
    `select data from mc_prescriptions ${where.length ? `where ${where.join(" and ")}` : ""}
      order by created_at desc limit 300`,
    params,
  );
  const refs = await loadRefs();
  return rows.map((r) => rxWithRefs(r.data, refs));
}

/** Doctor issues the e-prescription; this also completes the consultation. */
export async function issuePrescription(
  consultationId: string,
  doctorId: string,
  b: Record<string, unknown>,
): Promise<PrescriptionWithRefs> {
  const medicines: Medicine[] = (Array.isArray(b.medicines) ? b.medicines : [])
    .map((m: Record<string, unknown>) => ({
      name: str(m?.name, 120),
      dosage: str(m?.dosage, 40),
      frequency: str(m?.frequency, 40),
      timing: str(m?.timing, 40),
      duration: str(m?.duration, 40),
      quantity: str(m?.quantity, 20),
      instructions: str(m?.instructions, 200),
    }))
    .filter((m: Medicine) => m.name)
    .slice(0, 20);
  const diagnosis = str(b.diagnosis, 300);
  if (!diagnosis) throw new HttpError("Provisional diagnosis is required");
  if (medicines.length === 0 && !str(b.advice)) throw new HttpError("Add at least one medicine or advice");

  const db = await getDb();
  const rx = await db.transaction(async (tx) => {
    const c = await lockConsultation(tx, consultationId);
    if (!c) throw new HttpError("Consultation not found", 404);
    if (c.doctorId !== doctorId) throw new HttpError("Not your consultation", 403);
    if (c.prescriptionId) throw new HttpError("Prescription already issued", 409);

    const n = await nextCounter(tx, "rx");
    const now = new Date().toISOString();
    const p: Prescription = {
      id: newId("rx"),
      rxNo: `RX-${new Date().getFullYear()}-${String(n).padStart(5, "0")}`,
      token: c.token,
      consultationId: c.id,
      doctorId,
      storeId: c.storeId,
      patient: c.patient,
      diagnosis,
      chiefComplaint: str(b.chiefComplaint, 500) || [c.symptoms.join(", "), c.complaint].filter(Boolean).join(" — "),
      medicines,
      investigations: str(b.investigations, 500),
      advice: str(b.advice, 1000),
      followUp: str(b.followUp, 100),
      createdAt: now,
      dispensed: false,
    };
    await tx.query(
      `insert into mc_prescriptions (id, store_id, doctor_id, dispensed, created_at, data)
       values ($1, $2, $3, false, $4, $5::jsonb)`,
      [p.id, p.storeId, p.doctorId, p.createdAt, JSON.stringify(p)],
    );
    await saveConsultation(tx, {
      ...c,
      prescriptionId: p.id,
      ...(c.status === "in_call" ? { status: "completed" as const, endedAt: now } : {}),
    });
    return p;
  });
  return rxWithRefs(rx, await loadRefs());
}

/** Pharmacy counter marks medicines handed over. Staff can only touch their own store. */
export async function setDispensed(id: string, dispensed: boolean, storeId?: string): Promise<PrescriptionWithRefs> {
  const db = await getDb();
  const rx = await db.transaction(async (tx) => {
    const rows = await tx.query<{ data: Prescription }>("select data from mc_prescriptions where id = $1 for update", [id]);
    const p = rows[0]?.data;
    if (!p || (storeId && p.storeId !== storeId)) throw new HttpError("Not found", 404);
    const next: Prescription = { ...p, dispensed, dispensedAt: dispensed ? new Date().toISOString() : undefined };
    await tx.query("update mc_prescriptions set dispensed = $2, data = $3::jsonb where id = $1", [
      id,
      dispensed,
      JSON.stringify(next),
    ]);
    return next;
  });
  return rxWithRefs(rx, await loadRefs());
}

export async function countPrescriptionsToday(): Promise<number> {
  const db = await getDb();
  const rows = await db.query<{ n: string | number }>(
    `select count(*) as n from mc_prescriptions where ${todaySql("created_at", 1)}`,
    [env.timeZone],
  );
  return Number(rows[0]?.n ?? 0);
}
