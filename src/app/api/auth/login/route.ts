import { getDoctorRaw, getStoreRaw, publicDoctor, publicStore } from "@/features/admin/services/directory-service";
import { issueToken } from "@/features/auth/services/auth-service";
import { env } from "@/lib/server/env";
import { body, fail, handle, ok, str } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** POST { role: "doctor"|"staff"|"admin", id?, pin } → { token, profile } */
export const POST = handle(async (req: Request) => {
  const b = await body(req);
  const role = str(b.role);
  const id = str(b.id);
  const pin = str(b.pin, 12);

  if (role === "doctor") {
    const d = await getDoctorRaw(id);
    if (!d || d.pin !== pin) return fail("Incorrect doctor or PIN", 401);
    return ok({ token: issueToken("doctor", d.id), profile: publicDoctor(d) });
  }
  if (role === "staff") {
    const s = await getStoreRaw(id);
    if (!s || s.staffPin !== pin) return fail("Incorrect store or PIN", 401);
    return ok({ token: issueToken("staff", s.id), profile: publicStore(s) });
  }
  if (role === "admin") {
    if (pin !== env.adminPin) return fail("Incorrect admin PIN", 401);
    return ok({ token: issueToken("admin", "admin"), profile: { name: "Administrator" } });
  }
  return fail("Unknown role");
});
