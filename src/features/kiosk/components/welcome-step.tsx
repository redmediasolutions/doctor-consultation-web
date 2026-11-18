import { ClipboardListIcon, PillIcon, ShieldCheckIcon, StethoscopeIcon, VideoIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PublicStore } from "@/features/admin/types";
import { cn } from "@/lib/utils";

const HOW = [
  { icon: ClipboardListIcon, title: "Tell us about you", text: "Name, age and what's bothering you." },
  { icon: VideoIcon, title: "See a doctor on video", text: "A registered doctor joins in a few minutes." },
  { icon: PillIcon, title: "Collect your medicines", text: "The prescription goes straight to our counter." },
];

export function WelcomeStep({
  store,
  onlineCount,
  doctorsLoaded,
  onStart,
}: {
  store: PublicStore;
  onlineCount: number;
  doctorsLoaded: boolean;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 px-4 py-10">
      <div className="space-y-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
          <ShieldCheckIcon className="size-4 text-primary" /> Registered doctors · Private & secure
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-6xl">
          Talk to a doctor <span className="text-primary">right here.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-pretty text-muted-foreground md:text-xl">
          A video consultation at {store.name}. Your prescription is ready at the counter when the call ends.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Button size="lg" onClick={onStart} className="h-16 rounded-2xl px-10 text-xl shadow-lg">
            <StethoscopeIcon className="size-6" /> Consult a doctor now
          </Button>
          <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
            <span
              className={cn(
                "size-2 rounded-full",
                !doctorsLoaded ? "bg-muted-foreground/40" : onlineCount > 0 ? "bg-success" : "bg-warning",
              )}
            />
            {!doctorsLoaded
              ? "Checking doctors…"
              : onlineCount > 0
                ? `${onlineCount} doctor${onlineCount === 1 ? "" : "s"} online now`
                : "Doctors are offline right now — you can still join the queue"}
          </p>
        </div>
      </div>

      <ol className="grid gap-4 md:grid-cols-3">
        {HOW.map((h, i) => (
          <li key={h.title} className="flex gap-4 rounded-2xl border bg-card p-5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
              <h.icon className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wide text-primary">STEP {i + 1}</p>
              <p className="font-semibold">{h.title}</p>
              <p className="text-sm text-muted-foreground">{h.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
