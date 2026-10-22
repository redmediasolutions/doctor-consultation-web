import { requireRole } from "@/features/auth/services/auth-service";
import { listPrescriptions } from "@/features/prescriptions/services/prescription-service";
import { handle, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** GET ?storeId=&today=1&pending=1 — counters see only their store; doctors only their own. */
export const GET = handle(async (req: Request) => {
  const s = requireRole(req, "staff", "admin", "doctor");
  const url = new URL(req.url);
  return ok(
    await listPrescriptions({
      storeId: s.role === "staff" ? s.subject : url.searchParams.get("storeId"),
      doctorId: s.role === "doctor" ? s.subject : null,
      today: url.searchParams.get("today") === "1",
      pending: url.searchParams.get("pending") === "1",
    }),
  );
});
