import { getDb } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { handle, ok } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Quick check after deploying: database reachable and Agora configured. */
export const GET = handle(async () => {
  let database = "ok";
  try {
    const db = await getDb();
    await db.query("select 1");
  } catch (e) {
    database = (e as Error).message;
  }
  return ok({
    ok: database === "ok",
    database: env.databaseUrl ? (database === "ok" ? "postgres" : database) : database === "ok" ? "embedded" : database,
    agora: { appId: env.agora.appId, certificateConfigured: Boolean(env.agora.certificate) },
  });
});
