import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  tone?: "warning";
}) {
  return (
    <Card className={cn("gap-1 py-4", tone === "warning" && "border-warning/50 bg-warning/10")}>
      <CardContent className="px-4">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="size-3.5" /> {label}
        </p>
        <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

