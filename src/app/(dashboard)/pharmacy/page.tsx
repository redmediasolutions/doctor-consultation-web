"use client";

import { RoleGuard } from "@/features/auth/components/role-guard";
import { AdminStorePicker } from "@/features/prescriptions/components/admin-store-picker";
import { PharmacyCounter } from "@/features/prescriptions/components/pharmacy-counter";

/** Store staff → their own store's counter. Owner → pick any store. */
export default function PharmacyPage() {
  return (
    <RoleGuard kinds={["staff", "admin"]}>
      {(user) =>
        user.kind === "staff" && user.store ? (
          <PharmacyCounter key={user.store.id} store={user.store} user={user} />
        ) : (
          <AdminStorePicker user={user} />
        )
      }
    </RoleGuard>
  );
}
