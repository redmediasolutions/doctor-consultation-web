"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ConnectionState,
  IAgoraRTC,
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
  UID,
} from "agora-rtc-sdk-ng";

import type { ChatMessage, RtcCredentials } from "../types";

export type CallConnection = "idle" | "connecting" | "connected" | "reconnecting" | "failed";

/** Loads the Agora Web SDK only in the browser (it cannot run during server rendering). */
let sdk: Promise<IAgoraRTC> | null = null;
function loadSdk() {
  if (!sdk) {
    sdk = import("agora-rtc-sdk-ng").then((m) => {
      const AgoraRTC = m.default;
      AgoraRTC.setLogLevel(2); // warnings and errors only
      return AgoraRTC;
    });
  }
  return sdk;
}

function describeMediaError(e: unknown) {
  const msg = (e as Error)?.message || String(e);
  if (/PERMISSION_DENIED|NotAllowedError/i.test(msg)) return "Camera/microphone permission was blocked. Allow it in the browser.";
  if (/NOT_SUPPORTED|NotFoundError|DEVICE_NOT_FOUND/i.test(msg)) return "No camera or microphone found on this computer.";
  if (/https|secure/i.test(msg)) return "Video needs HTTPS. Open this site over https://";
  return msg;
}

/**
 * One Agora video call in the browser.
 * The channel/uid/token come from our API (/api/consultations/:id/rtc?as=doctor).
 * Chat uses the Agora data stream so it interoperates with the Flutter kiosk app.
 */
export function useAgoraCall() {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const audioRef = useRef<IMicrophoneAudioTrack | null>(null);
  const videoRef = useRef<ICameraVideoTrack | null>(null);
  const renewRef = useRef<(() => Promise<RtcCredentials>) | null>(null);
  const onMessageRef = useRef<((m: ChatMessage) => void) | null>(null);

  const [localVideo, setLocalVideo] = useState<ICameraVideoTrack | null>(null);
  const [remoteVideo, setRemoteVideo] = useState<IRemoteVideoTrack | null>(null);
  const [remoteUid, setRemoteUid] = useState<UID | null>(null);
  const [connection, setConnection] = useState<CallConnection>("idle");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Camera + mic for the self view (also used for the "camera check" before calls). */
  const startPreview = useCallback(async () => {
    if (videoRef.current && audioRef.current) return;
    setError(null);
    try {
      const AgoraRTC = await loadSdk();
      const [mic, cam] = await AgoraRTC.createMicrophoneAndCameraTracks(
        { encoderConfig: "speech_standard", AEC: true, ANS: true, AGC: true },
        { encoderConfig: "480p_1" },
      );
      audioRef.current = mic;
      videoRef.current = cam;
      setLocalVideo(cam);
      setMicOn(true);
      setCamOn(true);
    } catch (e) {
      setError(describeMediaError(e));
      throw e;
    }
  }, []);

  const stopPreview = useCallback(() => {
    audioRef.current?.close();
    videoRef.current?.close();
    audioRef.current = null;
    videoRef.current = null;
    setLocalVideo(null);
  }, []);

  const leave = useCallback(async () => {
    const client = clientRef.current;
    clientRef.current = null;
    renewRef.current = null;
    setRemoteVideo(null);
    setRemoteUid(null);
    setConnection("idle");
    if (client) {
      client.removeAllListeners();
      await client.leave().catch(() => undefined);
    }
    // Unmute for the next call.
    await audioRef.current?.setMuted(false).catch(() => undefined);
    await videoRef.current?.setMuted(false).catch(() => undefined);
    setMicOn(true);
    setCamOn(true);
  }, []);

  /** Joins the consultation channel and publishes camera + mic. */
  const join = useCallback(
    async (creds: RtcCredentials, renew?: () => Promise<RtcCredentials>) => {
      if (clientRef.current) await leave();
      setError(null);
      setConnection("connecting");
      renewRef.current = renew ?? null;
      try {
        const AgoraRTC = await loadSdk();
        await startPreview();
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        // Register handlers before joining so no event is missed.
        client.on("user-joined", (user: IAgoraRTCRemoteUser) => setRemoteUid(user.uid));
        client.on("user-published", async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video" | "datachannel") => {
          if (mediaType === "datachannel") return;
          await client.subscribe(user, mediaType);
          setRemoteUid(user.uid);
          if (mediaType === "video") setRemoteVideo(user.videoTrack ?? null);
          if (mediaType === "audio") user.audioTrack?.play();
        });
        client.on("user-unpublished", (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video" | "datachannel") => {
          if (mediaType === "video") setRemoteVideo(null);
          void user;
        });
        client.on("user-left", () => {
          setRemoteVideo(null);
          setRemoteUid(null);
        });
        client.on("connection-state-change", (state: ConnectionState) => {
          if (state === "CONNECTED") setConnection("connected");
          else if (state === "CONNECTING") setConnection("connecting");
          else if (state === "RECONNECTING") setConnection("reconnecting");
          else if (state === "DISCONNECTED" && clientRef.current === client) setConnection("failed");
        });
        client.on("token-privilege-will-expire", async () => {
          const r = renewRef.current;
          if (!r) return;
          try {
            const next = await r();
            if (next.token) await client.renewToken(next.token);
          } catch {
            /* will retry on the next warning */
          }
        });
        client.on("stream-message", (_uid: UID, payload: Uint8Array) => {
          try {
            const m = JSON.parse(new TextDecoder().decode(payload)) as ChatMessage;
            if (m && typeof m.text === "string") onMessageRef.current?.(m);
          } catch {
            /* not a chat message */
          }
        });

        await client.join(creds.appId, creds.channelName, creds.token || null, creds.uid);
        const tracks = [audioRef.current, videoRef.current].filter(Boolean) as (IMicrophoneAudioTrack | ICameraVideoTrack)[];
        await client.publish(tracks);
        setConnection("connected");
      } catch (e) {
        setConnection("failed");
        setError(describeMediaError(e));
        throw e;
      }
    },
    [leave, startPreview],
  );

  const toggleMic = useCallback(async () => {
    const t = audioRef.current;
    if (!t) return;
    const next = !micOn;
    await t.setMuted(!next);
    setMicOn(next);
  }, [micOn]);

  const toggleCam = useCallback(async () => {
    const t = videoRef.current;
    if (!t) return;
    const next = !camOn;
    await t.setMuted(!next);
    setCamOn(next);
  }, [camOn]);

  /** Sends a chat message over the Agora data stream (same JSON format as the Flutter app). */
  const sendChat = useCallback(async (m: ChatMessage) => {
    const client = clientRef.current as (IAgoraRTCClient & { sendStreamMessage?: (p: Uint8Array) => Promise<void> }) | null;
    if (!client?.sendStreamMessage) return false;
    try {
      await client.sendStreamMessage(new TextEncoder().encode(JSON.stringify(m)));
      return true;
    } catch {
      return false;
    }
  }, []);

  const onMessage = useCallback((fn: ((m: ChatMessage) => void) | null) => {
    onMessageRef.current = fn;
  }, []);

  // Release camera/mic when the page closes or the component unmounts.
  useEffect(
    () => () => {
      clientRef.current?.leave().catch(() => undefined);
      audioRef.current?.close();
      videoRef.current?.close();
    },
    [],
  );

  return {
    localVideo,
    remoteVideo,
    remoteUid,
    connection,
    micOn,
    camOn,
    error,
    startPreview,
    stopPreview,
    join,
    leave,
    toggleMic,
    toggleCam,
    sendChat,
    onMessage,
  };
}

export type AgoraCall = ReturnType<typeof useAgoraCall>;
