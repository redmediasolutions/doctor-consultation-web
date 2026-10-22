import { requireRole } from "@/features/auth/services/auth-service";
import { resetDatabase } from "@/lib/server/db";
import { handle, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Wipes consultations/prescriptions and restores the demo stores and doctors. */
export const POST = handle(async (req: Request) => {
  requireRole(req, "admin");
  await resetDatabase();
  return ok({ ok: true });
});
