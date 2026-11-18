"use client";

import { RoleGuard } from "@/features/auth/components/role-guard";
import { KioskScreen } from "@/features/kiosk/components/kiosk-screen";
import { KioskStoreGate } from "@/features/kiosk/components/kiosk-store-gate";

/**
 * Store kiosk in the browser (web version of the Flutter tablet app).
 * Store staff → their own store. Owner → pick a store once.
 */
export default function KioskPage() {
  return (
    <RoleGuard kinds={["staff", "admin"]}>
      {(user) =>
        user.kind === "staff" && user.store ? (
          <KioskScreen key={user.store.id} store={user.store} user={user} />
        ) : (
          <KioskStoreGate user={user} />
        )
      }
    </RoleGuard>
  );
}
