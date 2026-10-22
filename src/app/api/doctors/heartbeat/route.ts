import { heartbeat } from "@/features/admin/services/directory-service";
import type { DoctorStatus } from "@/features/admin/types";
import { requireRole } from "@/features/auth/services/auth-service";
import { body, handle, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** POST { status: "online" | "busy" | "offline" } — doctor presence ping. */
export const POST = handle(async (req: Request) => {
  const s = requireRole(req, "doctor");
  const b = await body<{ status?: DoctorStatus }>(req);
  const status: DoctorStatus = b.status === "online" || b.status === "busy" ? b.status : "offline";
  return ok(await heartbeat(s.subject, status));
});
