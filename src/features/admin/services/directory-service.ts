import "server-only";

import { DOCTOR_HEARTBEAT_TIMEOUT_MS } from "@/lib/config";
import { getDb, newId } from "@/lib/server/db";
import { HttpError, str } from "@/lib/server/http";
import type { Doctor, DoctorStatus, PublicDoctor, PublicStore, Store } from "../types";

/* ---------------------------------- stores ---------------------------------- */

export function publicStore(s: Store): PublicStore {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { staffPin, ...rest } = s;
  return rest;
}

export async function listStoresRaw(): Promise<Store[]> {
  const db = await getDb();
  const rows = await db.query<{ data: Store }>("select data from mc_stores order by created_at, id");
  return rows.map((r) => r.data);
}

export async function listStores(): Promise<PublicStore[]> {
  return (await listStoresRaw()).map(publicStore);
}

export async function getStoreRaw(id: string): Promise<Store | null> {
  const db = await getDb();
  const rows = await db.query<{ data: Store }>("select data from mc_stores where id = $1", [id]);
  return rows[0]?.data ?? null;
}

export async function createStore(b: Record<string, unknown>): Promise<PublicStore> {
  const name = str(b.name, 120);
  if (!name) throw new HttpError("Store name is required");
  const store: Store = {
    id: newId("store"),
    name,
    address: str(b.address, 200),
    city: str(b.city, 60),
    phone: str(b.phone, 30),
    pharmacistName: str(b.pharmacistName, 80),
    drugLicenseNo: str(b.drugLicenseNo, 60),
    staffPin: str(b.staffPin, 12) || "1111",
  };
  const db = await getDb();
  await db.query("insert into mc_stores (id, data) values ($1, $2::jsonb)", [store.id, JSON.stringify(store)]);
  return publicStore(store);
}

/* ---------------------------------- doctors --------------------------------- */

export function publicDoctor(d: Doctor): PublicDoctor {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { pin, ...rest } = d;
  const stale = !d.lastSeenAt || Date.now() - new Date(d.lastSeenAt).getTime() > DOCTOR_HEARTBEAT_TIMEOUT_MS;
  return { ...rest, status: stale ? "offline" : d.status };
}

export async function listDoctorsRaw(): Promise<Doctor[]> {
  const db = await getDb();
  const rows = await db.query<{ data: Doctor }>("select data from mc_doctors order by created_at, id");
  return rows.map((r) => r.data);
}

export async function listDoctors(): Promise<PublicDoctor[]> {
  return (await listDoctorsRaw()).map(publicDoctor);
}

export async function getDoctorRaw(id: string): Promise<Doctor | null> {
  const db = await getDb();
  const rows = await db.query<{ data: Doctor }>("select data from mc_doctors where id = $1", [id]);
  return rows[0]?.data ?? null;
}

export async function createDoctor(b: Record<string, unknown>): Promise<PublicDoctor> {
  const name = str(b.name, 80);
  const registrationNo = str(b.registrationNo, 40);
  if (!name || !registrationNo) throw new HttpError("Name and medical registration number are required");
  const languages = Array.isArray(b.languages)
    ? b.languages.map((l) => str(l, 30)).filter(Boolean)
    : str(b.languages, 120)
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
  const doctor: Doctor = {
    id: newId("doc"),
    name: /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`,
    specialty: str(b.specialty, 60) || "General Physician",
    qualification: str(b.qualification, 120),
    registrationNo,
    experienceYears: Number(b.experienceYears) || 0,
    languages,
    fee: Number(b.fee) || 0,
    pin: str(b.pin, 12) || "1234",
    status: "offline",
  };
  const db = await getDb();
  await db.query("insert into mc_doctors (id, data) values ($1, $2::jsonb)", [doctor.id, JSON.stringify(doctor)]);
  return publicDoctor(doctor);
}

/** Doctor app/web pings every ~15 s with availability. */
export async function heartbeat(doctorId: string, status: DoctorStatus): Promise<PublicDoctor> {
  const db = await getDb();
  const rows = await db.query<{ data: Doctor }>(
    `update mc_doctors
        set data = data || jsonb_build_object('status', $2::text, 'lastSeenAt', $3::text)
      where id = $1
      returning data`,
    [doctorId, status, new Date().toISOString()],
  );
  if (!rows[0]) throw new HttpError("Doctor not found", 404);
  return publicDoctor(rows[0].data);
}

/** Lookup maps used to attach doctor/store details to consultations and prescriptions. */
export async function loadRefs() {
  const [stores, doctors] = await Promise.all([listStoresRaw(), listDoctorsRaw()]);
  return {
    stores: new Map(stores.map((s) => [s.id, publicStore(s)])),
    doctors: new Map(doctors.map((d) => [d.id, publicDoctor(d)])),
    doctorsRaw: new Map(doctors.map((d) => [d.id, d])),
  };
}

export type Refs = Awaited<ReturnType<typeof loadRefs>>;
