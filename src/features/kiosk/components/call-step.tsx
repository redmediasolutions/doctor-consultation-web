"use client";

import { MessageSquareIcon, RefreshCwIcon, WifiOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/features/consultations/components/chat-panel";
import { VideoStage } from "@/features/consultations/components/video-stage";
import type { Kiosk } from "../hooks/use-kiosk";

export function CallStep({ k, onLeave }: { k: Kiosk; onLeave: () => void }) {
  const c = k.consultation;
  const doctor = c?.doctor;
  return (
    <div className="mx-auto grid w-full max-w-7xl flex-1 gap-4 p-4 lg:grid-cols-[1fr_360px]">
      <div className="flex min-h-[60vh] flex-col gap-3">
        {k.videoError && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
            <span className="flex items-center gap-2">
              <WifiOffIcon className="size-4" /> Video problem: {k.videoError}
            </span>
            <Button size="sm" variant="outline" onClick={() => void k.reconnect()}>
              <RefreshCwIcon /> Reconnect
            </Button>
          </div>
        )}
        <VideoStage
          className="min-h-[50vh] flex-1"
          local={k.call.localVideo}
          remote={k.call.remoteVideo}
          remotePresent={k.call.remoteUid !== null}
          remoteLabel={doctor?.name ?? "Doctor"}
          remoteSub={doctor ? [doctor.specialty, doctor.qualification, doctor.registrationNo && `Reg. ${doctor.registrationNo}`].filter(Boolean).join(" · ") : undefined}
          since={c?.acceptedAt}
          connection={k.call.connection}
          waitingText="Connecting to the doctor…"
          micOn={k.call.micOn}
          camOn={k.call.camOn}
          onToggleMic={() => void k.call.toggleMic()}
          onToggleCam={() => void k.call.toggleCam()}
          onHangUp={onLeave}
          hangUpLabel="Leave"
        />
        {c && (
          <p className="text-center text-sm text-muted-foreground">
            Token <span className="font-mono font-medium text-foreground">{c.token}</span> · Stay until the doctor finishes —
            your prescription appears here.
          </p>
        )}
      </div>
      <div className="flex min-h-80 flex-col overflow-hidden rounded-2xl border bg-card" onFocus={k.markChatRead} onPointerDown={k.markChatRead}>
        <div className="flex items-center gap-2 border-b px-4 py-3 font-medium">
          <MessageSquareIcon className="size-4 text-primary" /> Chat with the doctor
          {k.unread && <span className="size-2 rounded-full bg-primary" aria-label="New message" />}
        </div>
        <ChatPanel className="flex-1" messages={k.messages} me="patient" onSend={k.sendChat} disabled={k.call.connection !== "connected"} />
      </div>
    </div>
  );
}
