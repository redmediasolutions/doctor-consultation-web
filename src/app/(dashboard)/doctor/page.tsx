"use client";

import { RoleGuard } from "@/features/auth/components/role-guard";
import { DoctorConsole } from "@/features/consultations/components/doctor-console";

export default function DoctorPage() {
  return (
    <RoleGuard kinds={["doctor"]}>
      {(user) => (user.doctor ? <DoctorConsole key={user.doctor.id} doctor={user.doctor} /> : null)}
    </RoleGuard>
  );
}
