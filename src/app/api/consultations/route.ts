import { requireRole } from "@/features/auth/services/auth-service";
import { createConsultation, listConsultations } from "@/features/consultations/services/consultation-service";
import { body, handle, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/**
 * GET — staff / doctor / admin.
 *   ?status=waiting|in_call|completed|cancelled|active  ?storeId=  ?doctorId=me|<id>  ?today=1
 */
export const GET = handle(async (req: Request) => {
  const s = requireRole(req, "doctor", "staff", "admin");
  const url = new URL(req.url);
  let storeId = url.searchParams.get("storeId");
  let doctorId = url.searchParams.get("doctorId");
  if (s.role === "staff") storeId = s.subject; // counters only see their own store
  if (doctorId === "me" && s.role === "doctor") doctorId = s.subject;
  return ok(
    await listConsultations({
      status: url.searchParams.get("status"),
      storeId,
      doctorId,
      today: url.searchParams.get("today") === "1",
    }),
  );
});

/** POST — created by the store kiosk (Flutter app). */
export const POST = handle(async (req: Request) => ok(await createConsultation(await body(req)), { status: 201 }));
