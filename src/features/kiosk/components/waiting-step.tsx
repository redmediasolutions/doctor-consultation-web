import { Loader2Icon, TicketIcon, UsersIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AgoraVideo } from "@/features/consultations/components/video-stage";
import type { Kiosk } from "../hooks/use-kiosk";

export function WaitingStep({ k, onCancel }: { k: Kiosk; onCancel: () => void }) {
  const c = k.consultation;
  if (!c) return null;
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-4 py-10 text-center">
      <div className="space-y-3">
        <span className="relative mx-auto flex size-20 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <span className="relative flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Loader2Icon className="size-9 animate-spin" />
          </span>
        </span>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Finding a doctor for you</h1>
        <p className="text-lg text-muted-foreground">
          Please stay in front of the screen. The doctor&apos;s video starts here automatically.
        </p>
      </div>

      <div className="grid w-full max-w-md grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-card p-5">
          <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <TicketIcon className="size-4" /> Your token
          </p>
          <p className="mt-1 font-mono text-4xl font-semibold tracking-tight" data-testid="kiosk-token">
            {c.token}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <UsersIcon className="size-4" /> Ahead of you
          </p>
          <p className="mt-1 text-4xl font-semibold tabular-nums">{c.waitingAhead ?? 0}</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {c.specialty} · {k.form.name.trim() || c.patient.name}
      </p>

      {k.call.localVideo && (
        <div className="aspect-video w-56 overflow-hidden rounded-xl ring-1 ring-black/10">
          <AgoraVideo track={k.call.localVideo} mirror />
        </div>
      )}

      <Button variant="outline" size="lg" onClick={onCancel} className="h-12">
        <XIcon /> Cancel request
      </Button>
    </div>
  );
}
