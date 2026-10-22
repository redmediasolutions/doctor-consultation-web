import { requireRole } from "@/features/auth/services/auth-service";
import {
  acceptConsultation,
  cancelConsultation,
  endConsultation,
  getConsultation,
} from "@/features/consultations/services/consultation-service";
import { body, fail, handle, ok, str } from "@/lib/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** The consultation id is an unguessable token held by the kiosk that created it. */
export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  const c = await getConsultation(id);
  return c ? ok(c) : fail("Not found", 404);
});

/**
 * PATCH { action }
 *   accept — doctor takes a waiting patient (only one doctor can win)
 *   end    — doctor ends without a prescription
 *   cancel — kiosk cancels while waiting / patient leaves
 */
export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const b = await body(req);
  const action = str(b.action);
  if (action === "accept") return ok(await acceptConsultation(id, requireRole(req, "doctor").subject));
  if (action === "end") return ok(await endConsultation(id, requireRole(req, "doctor").subject));
  if (action === "cancel") return ok(await cancelConsultation(id, str(b.reason, 200)));
  return fail("Unknown action");
});

/** navigator.sendBeacon can only POST. */
export const POST = PATCH;
