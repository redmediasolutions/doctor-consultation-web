"use client";

import type { PublicStore } from "@/features/admin/types";
import { RoleGuard } from "@/features/auth/components/role-guard";
import { PharmacyCounter } from "@/features/prescriptions/components/pharmacy-counter";

export default function PharmacyPage() {
  return <RoleGuard<PublicStore> role="staff">{(store) => <PharmacyCounter key={store.id} store={store} />}</RoleGuard>;
}
