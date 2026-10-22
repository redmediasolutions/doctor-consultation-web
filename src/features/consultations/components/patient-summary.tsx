import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, initials } from "@/lib/utils";
import type { ConsultationWithRefs } from "../types";

export function PatientSummary({ c }: { c: ConsultationWithRefs }) {
  const v = c.vitals;
  const vitals: [string, string | undefined, string][] = [
    ["BP", v.bp, "mmHg"],
    ["Pulse", v.pulse, "/min"],
    ["Temp", v.temperature, "°F"],
    ["SpO₂", v.spo2, "%"],
    ["Weight", v.weight, "kg"],
  ];
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          <AvatarFallback className="bg-primary/15 text-primary">{initials(c.patient.name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-semibold">{c.patient.name}</p>
          <p className="text-sm text-muted-foreground">
            {c.patient.age} years · {c.patient.gender} · +91 {c.patient.phone}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Presenting complaint</p>
        <div className="flex flex-wrap gap-1.5">
          {c.symptoms.map((s) => (
            <Badge key={s} variant="secondary">
              {s}
            </Badge>
          ))}
        </div>
        {c.complaint && <p className="mt-2 text-sm">{c.complaint}</p>}
        {c.duration && <p className="mt-1 text-sm text-muted-foreground">Duration: {c.duration}</p>}
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Vitals (recorded at store)</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {vitals.map(([label, val, unit]) => (
            <div key={label} className="rounded-lg border bg-muted/40 p-2.5">
              <p className="text-[11px] text-muted-foreground">{label}</p>
              <p className="font-semibold tabular-nums">
                {val || "—"}
                {val && <span className="ml-0.5 text-[11px] font-normal text-muted-foreground">{unit}</span>}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border p-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Allergies</p>
        <p className={cn("text-sm", c.allergies && "font-medium text-destructive")}>{c.allergies || "None reported"}</p>
      </div>

      <div className="rounded-lg border p-3 text-sm">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Store</p>
        <p className="font-medium">{c.store?.name}</p>
        <p className="text-muted-foreground">
          {c.store?.address}, {c.store?.city} · Pharmacist {c.store?.pharmacistName}
        </p>
      </div>
    </div>
  );
}
