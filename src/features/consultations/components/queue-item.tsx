import { ClockIcon, MapPinIcon, PhoneCallIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";
import type { ConsultationWithRefs } from "../types";

export function QueueItem({
  c,
  position,
  mismatch,
  onAccept,
  disabled,
}: {
  c: ConsultationWithRefs;
  position: number;
  mismatch: boolean;
  onAccept: () => void;
  disabled?: boolean;
}) {
  const v = c.vitals;
  const vitals = [v.bp && `BP ${v.bp}`, v.pulse && `Pulse ${v.pulse}`, v.temperature && `${v.temperature}°F`, v.spo2 && `SpO₂ ${v.spo2}%`]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 md:flex-row md:items-center">
      <div className="flex flex-1 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">
          {position}
        </span>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{c.patient.name}</p>
            <span className="text-sm text-muted-foreground">
              {c.patient.age} y · {c.patient.gender}
            </span>
            <Badge variant={mismatch ? "outline" : "secondary"}>{c.specialty}</Badge>
          </div>
          <p className="line-clamp-2 text-sm">
            {[c.symptoms.join(", "), c.complaint].filter(Boolean).join(" — ")}
            {c.duration && <span className="text-muted-foreground"> · {c.duration}</span>}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPinIcon className="size-3" /> {c.store?.name}
            </span>
            <span className="flex items-center gap-1">
              <ClockIcon className="size-3" /> waiting {timeAgo(c.createdAt).replace(" ago", "")}
            </span>
            {vitals && <span>{vitals}</span>}
            {c.allergies && <span className="font-medium text-destructive">Allergy: {c.allergies}</span>}
          </p>
        </div>
      </div>
      <Button onClick={onAccept} disabled={disabled} className="md:w-auto" size="lg">
        <PhoneCallIcon /> Accept &amp; call
      </Button>
    </div>
  );
}

