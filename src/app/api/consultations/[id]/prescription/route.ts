import { requireRole } from "@/features/auth/services/auth-service";
import { issuePrescription } from "@/features/prescriptions/services/prescription-service";
import { body, handle, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Doctor issues the e-prescription; this also completes the consultation. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const s = requireRole(req, "doctor");
  const { id } = await params;
  return ok(await issuePrescription(id, s.subject, await body(req)), { status: 201 });
});
