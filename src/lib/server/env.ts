import "server-only";
import crypto from "node:crypto";
import path from "node:path";

import { AGORA_APP_ID } from "@/lib/config";

/**
 * Server settings from environment variables (.env.local locally, Project → Settings →
 * Environment Variables on Vercel). Only AGORA_APP_CERTIFICATE (and DATABASE_URL on Vercel)
 * are required; everything else has a sensible default.
 */
const certificate = (process.env.AGORA_APP_CERTIFICATE || "").trim();

export const env = {
  agora: {
    appId: (process.env.AGORA_APP_ID || AGORA_APP_ID).trim(),
    certificate,
    tokenTtlSeconds: Number(process.env.AGORA_TOKEN_TTL || 3600),
  },

  /**
   * Signs staff sessions. Falls back to a value derived from the Agora certificate so a
   * deployment works with just that one secret. Set SESSION_SECRET to rotate sessions.
   */
  sessionSecret:
    process.env.SESSION_SECRET ||
    (certificate
      ? crypto.createHash("sha256").update(`medconnect-session:${certificate}`).digest("hex")
      : "dev-only-session-secret"),

  adminPin: process.env.ADMIN_PIN || "0000",

  /** Postgres connection string (Vercel → Storage → Neon adds this automatically). */
  databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL || "",

  /** Embedded database folder used when DATABASE_URL is not set (local dev / VPS). */
  dataDir: process.env.DATA_DIR || path.join(process.cwd(), "data", "pglite"),

  /** "Today" in reports and lists is computed in this time zone. */
  timeZone: process.env.APP_TIMEZONE || "Asia/Kolkata",

  isVercel: Boolean(process.env.VERCEL),
};
