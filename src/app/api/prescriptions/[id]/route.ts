import { requireRole } from "@/features/auth/services/auth-service";
import { getPrescription, setDispensed } from "@/features/prescriptions/services/prescription-service";
import { body, fail, handle, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Prescription ids are unguessable; the kiosk fetches its patient's Rx by id. */
export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  const rx = await getPrescription(id);
  return rx ? ok(rx) : fail("Not found", 404);
});

/** PATCH { dispensed } — pharmacy counter. */
export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const s = requireRole(req, "staff", "admin");
  const { id } = await params;
  const b = await body<{ dispensed?: boolean }>(req);
  return ok(await setDispensed(id, Boolean(b.dispensed), s.role === "staff" ? s.subject : undefined));
});
