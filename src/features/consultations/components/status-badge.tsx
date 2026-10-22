import { Badge } from "@/components/ui/badge";
import type { DoctorStatus } from "@/features/admin/types";
import type { ConsultationStatus } from "../types";

const consult: Record<ConsultationStatus, { label: string; variant: "warning" | "default" | "success" | "muted" }> = {
  waiting: { label: "Waiting", variant: "warning" },
  in_call: { label: "In call", variant: "default" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "muted" },
};

export function ConsultStatusBadge({ status }: { status: ConsultationStatus }) {
  const s = consult[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export function DoctorStatusBadge({ status }: { status: DoctorStatus }) {
  const map = {
    online: { label: "Available", variant: "success", dot: "bg-success" },
    busy: { label: "In consultation", variant: "warning", dot: "bg-warning" },
    offline: { label: "Offline", variant: "muted", dot: "bg-muted-foreground/50" },
  } as const;
  const s = map[status];
  return (
    <Badge variant={s.variant}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </Badge>
  );
}
