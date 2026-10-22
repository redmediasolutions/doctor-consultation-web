import { createStore, listStores } from "@/features/admin/services/directory-service";
import { requireRole } from "@/features/auth/services/auth-service";
import { body, handle, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = handle(async () => ok(await listStores()));

export const POST = handle(async (req: Request) => {
  requireRole(req, "admin");
  return ok(await createStore(await body(req)), { status: 201 });
});
