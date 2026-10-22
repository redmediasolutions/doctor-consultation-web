import { getAdminStats } from "@/features/admin/services/stats-service";
import { requireRole } from "@/features/auth/services/auth-service";
import { handle, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  requireRole(req, "admin");
  return ok(await getAdminStats());
});
