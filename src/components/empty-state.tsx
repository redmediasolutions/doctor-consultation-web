import { InboxIcon, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  icon: Icon = InboxIcon,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2 py-12 text-center text-muted-foreground", className)}>
      <Icon className="size-10 opacity-40" />
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm">{description}</p>}
    </div>
  );
}
