"use client";

import { RoleGuard } from "@/features/auth/components/role-guard";
import type { PublicDoctor } from "@/features/admin/types";
import { DoctorConsole } from "@/features/consultations/components/doctor-console";

export default function DoctorPage() {
  return <RoleGuard<PublicDoctor> role="doctor">{(doctor) => <DoctorConsole key={doctor.id} doctor={doctor} />}</RoleGuard>;
}
