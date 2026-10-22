import "server-only";

import { loadRefs, type Refs } from "@/features/admin/services/directory-service";
import { SPECIALTIES } from "@/lib/config";
import { getDb, newId, nextCounter, todaySql, type Sql } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { HttpError, str } from "@/lib/server/http";
import type { Consultation, ConsultationStatus, ConsultationWithRefs, Patient } from "../types";

const COLUMNS = "data";

export function withRefs(c: Consultation, refs: Refs): ConsultationWithRefs {
  return {
    ...c,
    doctor: c.doctorId ? refs.doctors.get(c.doctorId) : undefined,
    store: refs.stores.get(c.storeId),
  };
}

async function save(tx: Sql, c: Consultation) {
  await tx.query(
    `insert into mc_consultations (id, store_id, doctor_id, status, created_at, data)
     values ($1, $2, $3, $4, $5, $6::jsonb)
     on conflict (id) do update set doctor_id = excluded.doctor_id, status = excluded.status, data = excluded.data`,
    [c.id, c.storeId, c.doctorId ?? null, c.status, c.createdAt, JSON.stringify(c)],
  );
}

async function lockOne(tx: Sql, id: string): Promise<Consultation | null> {
  const rows = await tx.query<{ data: Consultation }>(`select ${COLUMNS} from mc_consultations where id = $1 for update`, [
    id,
  ]);
  return rows[0]?.data ?? null;
}

/** Patients nobody picked up within 20 minutes leave the queue. */
export async function expireStaleWaiting() {
  const db = await getDb();
  await db.query(
    `update mc_consultations
        set status = 'cancelled',
            data = data || jsonb_build_object('status', 'cancelled',
                                              'cancelReason', 'No doctor connected within 20 minutes',
                                              'endedAt', $1::text)
      where status = 'waiting' and created_at < now() - interval '20 minutes'`,
    [new Date().toISOString()],
  );
}

/* ---------------------------------- queries --------------------------------- */

export async function getConsultation(id: string): Promise<ConsultationWithRefs | null> {
  const db = await getDb();
  const rows = await db.query<{ data: Consultation }>(`select ${COLUMNS} from mc_consultations where id = $1`, [id]);
  const c = rows[0]?.data;
  if (!c) return null;
  let waitingAhead = 0;
  if (c.status === "waiting") {
    const ahead = await db.query<{ n: string | number }>(
      "select count(*) as n from mc_consultations where status = 'waiting' and created_at < $1",
      [c.createdAt],
    );
    waitingAhead = Number(ahead[0]?.n ?? 0);
  }
  return { ...withRefs(c, await loadRefs()), waitingAhead };
}

export async function listConsultations(filter: {
  status?: string | null;
  storeId?: string | null;
  doctorId?: string | null;
  today?: boolean;
}): Promise<ConsultationWithRefs[]> {
  await expireStaleWaiting();
  const db = await getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };

  if (filter.status === "active") where.push("status in ('waiting', 'in_call')");
  else if (filter.status) where.push(`status = ${p(filter.status)}`);
  if (filter.storeId) where.push(`store_id = ${p(filter.storeId)}`);
  if (filter.doctorId) where.push(`doctor_id = ${p(filter.doctorId)}`);
  if (filter.today) {
    params.push(env.timeZone);
    where.push(todaySql("created_at", params.length));
  }
  const order = filter.status === "waiting" ? "asc" : "desc";
  const rows = await db.query<{ data: Consultation }>(
    `select ${COLUMNS} from mc_consultations ${where.length ? `where ${where.join(" and ")}` : ""}
      order by created_at ${order} limit 300`,
    params,
  );
  const refs = await loadRefs();
  return rows.map((r) => withRefs(r.data, refs));
}

/* -------------------------------- mutations --------------------------------- */

export async function createConsultation(b: Record<string, unknown>): Promise<ConsultationWithRefs> {
  const p = (b.patient ?? {}) as Partial<Patient>;
  const storeId = str(b.storeId, 60);
  const name = str(p.name, 80);
  const age = Number(p.age);
  const gender = (["Male", "Female", "Other"] as const).includes(p.gender as Patient["gender"])
    ? (p.gender as Patient["gender"])
    : "Other";
  const phone = str(p.phone, 15).replace(/[^\d+]/g, "");

  const refs = await loadRefs();
  if (!refs.stores.has(storeId)) throw new HttpError("Unknown store");
  if (!name) throw new HttpError("Patient name is required");
  if (!Number.isFinite(age) || age < 0 || age > 120) throw new HttpError("Enter a valid age");
  if (phone.replace(/\D/g, "").length < 10) throw new HttpError("Enter a valid 10-digit mobile number");
  if (b.consent !== true) throw new HttpError("Consent is required for a teleconsultation");

  const specialty = (SPECIALTIES as readonly string[]).includes(str(b.specialty)) ? str(b.specialty) : "General Physician";
  const v = (b.vitals ?? {}) as Record<string, unknown>;

  const db = await getDb();
  const consultation = await db.transaction(async (tx) => {
    const n = await nextCounter(tx, "token");
    const c: Consultation = {
      id: newId("con"),
      token: `T${String(n % 1000).padStart(3, "0")}`,
      storeId,
      patient: { name, age: Math.round(age), gender, phone },
      symptoms: Array.isArray(b.symptoms) ? b.symptoms.map((s) => str(s, 40)).filter(Boolean).slice(0, 12) : [],
      complaint: str(b.complaint, 1000),
      duration: str(b.duration, 40),
      allergies: str(b.allergies, 200),
      vitals: {
        bp: str(v.bp, 12),
        pulse: str(v.pulse, 6),
        temperature: str(v.temperature, 6),
        spo2: str(v.spo2, 6),
        weight: str(v.weight, 6),
      },
      specialty,
      status: "waiting",
      createdAt: new Date().toISOString(),
    };
    await save(tx, c);
    return c;
  });
  return withRefs(consultation, refs);
}

/** Doctor takes a waiting patient. Row lock guarantees only one doctor wins. */
export async function acceptConsultation(id: string, doctorId: string): Promise<ConsultationWithRefs> {
  const db = await getDb();
  const updated = await db.transaction(async (tx) => {
    const c = await lockOne(tx, id);
    if (!c) throw new HttpError("Not found", 404);
    if (c.status !== "waiting") throw new HttpError("Another doctor has already taken this patient", 409);
    const busy = await tx.query("select 1 from mc_consultations where doctor_id = $1 and status = 'in_call' limit 1", [
      doctorId,
    ]);
    if (busy.length) throw new HttpError("Finish your current consultation first", 409);
    const next: Consultation = { ...c, status: "in_call", doctorId, acceptedAt: new Date().toISOString() };
    await save(tx, next);
    await tx.query(
      `update mc_doctors set data = data || jsonb_build_object('status', 'busy', 'lastSeenAt', $2::text) where id = $1`,
      [doctorId, new Date().toISOString()],
    );
    return next;
  });
  return withRefs(updated, await loadRefs());
}

async function transition(
  id: string,
  apply: (c: Consultation) => Consultation | null,
): Promise<ConsultationWithRefs> {
  const db = await getDb();
  const updated = await db.transaction(async (tx) => {
    const c = await lockOne(tx, id);
    if (!c) throw new HttpError("Not found", 404);
    const next = apply(c);
    if (next) await save(tx, next);
    return next ?? c;
  });
  return withRefs(updated, await loadRefs());
}

/** Doctor ends the call without a prescription. */
export function endConsultation(id: string, doctorId: string) {
  return transition(id, (c) => {
    if (c.doctorId !== doctorId) throw new HttpError("Not your consultation", 403);
    if (c.status !== "in_call") return null;
    return { ...c, status: "completed", endedAt: new Date().toISOString() };
  });
}

/** Kiosk cancels while waiting / patient leaves the call. */
export function cancelConsultation(id: string, reason: string) {
  return transition(id, (c) => {
    if (c.status !== "waiting" && c.status !== "in_call") return null;
    return {
      ...c,
      status: "cancelled" as ConsultationStatus,
      cancelReason: reason || "Cancelled at kiosk",
      endedAt: new Date().toISOString(),
    };
  });
}

/** Raw row inside a transaction (used when issuing a prescription). */
export { lockOne as lockConsultation, save as saveConsultation };
