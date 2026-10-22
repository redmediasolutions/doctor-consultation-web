import { readSession } from "@/features/auth/services/auth-service";
import { getConsultation } from "@/features/consultations/services/consultation-service";
import { RTC_UID } from "@/lib/config";
import { buildRtcCredentials } from "@/lib/server/agora";
import { fail, handle, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET ?as=patient|doctor → Agora credentials for this consultation's channel (channel = consultation id).
 * Patient (kiosk): allowed once a doctor has accepted. Doctor: must be the assigned doctor.
 */
export const GET = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const as = new URL(req.url).searchParams.get("as") === "doctor" ? "doctor" : "patient";
  const c = await getConsultation(id);
  if (!c) return fail("Not found", 404);
  if (c.status !== "in_call") return fail("Consultation is not in a call", 409);
  if (as === "doctor") {
    const s = readSession(req);
    if (!s || s.role !== "doctor") return fail("Unauthorised", 401);
    if (c.doctorId !== s.subject) return fail("Not your consultation", 403);
  }
  return ok(buildRtcCredentials(c.id, RTC_UID[as]));
});
