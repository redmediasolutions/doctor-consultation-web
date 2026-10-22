"use client";

import { useEffect, useRef, useState } from "react";
import type { ILocalVideoTrack, IRemoteVideoTrack } from "agora-rtc-sdk-ng";
import { Loader2Icon, MicIcon, MicOffIcon, PhoneOffIcon, VideoIcon, VideoOffIcon, WifiOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CallConnection } from "../hooks/use-agora-call";

/** Renders an Agora video track into a div. */
export function AgoraVideo({
  track,
  mirror,
  className,
}: {
  track: ILocalVideoTrack | IRemoteVideoTrack | null;
  mirror?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !track) return;
    track.play(el, { fit: "cover", mirror });
    return () => track.stop();
  }, [track, mirror]);
  return <div ref={ref} className={cn("size-full bg-neutral-950", className)} />;
}

function useElapsed(since?: string, running?: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!since || !running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [since, running]);
  if (!since) return "00:00";
  const s = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function VideoStage({
  local,
  remote,
  remotePresent,
  remoteLabel,
  remoteSub,
  since,
  connection,
  waitingText = "Connecting…",
  micOn,
  camOn,
  onToggleMic,
  onToggleCam,
  onHangUp,
  hangUpLabel = "End",
  className,
}: {
  local: ILocalVideoTrack | null;
  remote: IRemoteVideoTrack | null;
  remotePresent: boolean;
  remoteLabel: string;
  remoteSub?: string;
  since?: string;
  connection: CallConnection;
  waitingText?: string;
  micOn: boolean;
  camOn: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onHangUp?: () => void;
  hangUpLabel?: string;
  className?: string;
}) {
  const elapsed = useElapsed(since, remotePresent);
  const problem = connection === "reconnecting" || connection === "failed";

  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-neutral-950 shadow-lg ring-1 ring-black/10", className)}>
      {remote ? (
        <AgoraVideo track={remote} />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
          {remotePresent ? (
            <>
              <VideoOffIcon className="size-8 opacity-70" />
              <p className="text-sm font-medium">{remoteLabel} turned the camera off</p>
            </>
          ) : (
            <>
              <Loader2Icon className="size-8 animate-spin opacity-80" />
              <p className="text-sm font-medium">{waitingText}</p>
            </>
          )}
        </div>
      )}

      <div className="absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/60 to-transparent p-4 text-white">
        <div>
          <p className="text-base font-semibold">{remoteLabel}</p>
          {remoteSub && <p className="text-xs opacity-80">{remoteSub}</p>}
        </div>
        {remotePresent && (
          <span className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 font-mono text-sm tabular-nums backdrop-blur">
            <span className="size-2 animate-pulse rounded-full bg-red-500" />
            {elapsed}
          </span>
        )}
      </div>

      {problem && (
        <div className="absolute inset-x-0 top-16 flex justify-center">
          <span className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white">
            <WifiOffIcon className="size-4 text-amber-400" />
            {connection === "reconnecting" ? "Reconnecting…" : "Connection lost"}
          </span>
        </div>
      )}

      {local && (
        <div className="absolute right-4 bottom-24 aspect-video w-36 overflow-hidden rounded-xl shadow-xl ring-2 ring-white/70 md:w-44">
          <AgoraVideo track={local} mirror />
          {!camOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-800 text-white/80">
              <VideoOffIcon className="size-6" />
            </div>
          )}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 bg-gradient-to-t from-black/70 to-transparent p-4">
        <Button
          size="icon-lg"
          variant="secondary"
          onClick={onToggleMic}
          aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
          className={cn("bg-white/90 text-neutral-900 hover:bg-white", !micOn && "bg-red-500 text-white hover:bg-red-500/90")}
        >
          {micOn ? <MicIcon /> : <MicOffIcon />}
        </Button>
        <Button
          size="icon-lg"
          variant="secondary"
          onClick={onToggleCam}
          aria-label={camOn ? "Turn camera off" : "Turn camera on"}
          className={cn("bg-white/90 text-neutral-900 hover:bg-white", !camOn && "bg-red-500 text-white hover:bg-red-500/90")}
        >
          {camOn ? <VideoIcon /> : <VideoOffIcon />}
        </Button>
        {onHangUp && (
          <Button size="lg" variant="destructive" onClick={onHangUp} className="h-14 rounded-full px-6">
            <PhoneOffIcon className="size-5" />
            {hangUpLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
