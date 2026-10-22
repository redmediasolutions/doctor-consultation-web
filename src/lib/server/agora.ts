import "server-only";
import { RtcRole, RtcTokenBuilder } from "agora-token";

import type { RtcCredentials } from "@/features/consultations/types";
import { env } from "./env";

/**
 * Signs an Agora RTC token for one user in one consultation channel.
 * This is the only thing the server does for video — media flows through Agora.
 * With no certificate configured the token is "" (works only for Agora projects in testing mode).
 */
export function buildRtcCredentials(channelName: string, uid: number): RtcCredentials {
  const { appId, certificate, tokenTtlSeconds } = env.agora;
  const expiresAt = new Date(Date.now() + tokenTtlSeconds * 1000).toISOString();
  const token = certificate
    ? RtcTokenBuilder.buildTokenWithUid(appId, certificate, channelName, uid, RtcRole.PUBLISHER, tokenTtlSeconds, tokenTtlSeconds)
    : "";
  return { appId, channelName, uid, token, expiresAt };
}
