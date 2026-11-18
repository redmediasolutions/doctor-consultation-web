import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = ["Your details", "Your concern", "Review & camera"];

/** Frame for the three form steps: progress, title, content, Back / Next. */
export function StepShell({
  index,
  title,
  description,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  nextPending,
  footerNote,
}: {
  index: 0 | 1 | 2;
  title: string;
  description?: string;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextPending?: boolean;
  footerNote?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 md:py-8">
      <ol className="grid grid-cols-3 gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="space-y-2">
            <div className={cn("h-1.5 rounded-full", i <= index ? "bg-primary" : "bg-muted")} />
            <p className={cn("text-xs font-medium sm:text-sm", i === index ? "text-foreground" : "text-muted-foreground")}>
              {i + 1}. {s}
            </p>
          </li>
        ))}
      </ol>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      <div className="flex-1">{children}</div>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t bg-background/95 px-4 py-4 backdrop-blur">
        <Button variant="outline" size="lg" onClick={onBack} className="h-12 px-6 text-base">
          <ArrowLeftIcon /> {index === 0 ? "Cancel" : "Back"}
        </Button>
        <div className="flex items-center gap-3">
          {footerNote}
          <Button size="lg" onClick={onNext} disabled={nextDisabled || nextPending} className="h-12 px-8 text-base">
            {nextLabel} {!nextPending && <ArrowRightIcon />}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Big tappable choice chip (gender, symptoms, duration). */
export function Chip({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "min-h-12 rounded-xl border px-4 py-2.5 text-left text-base font-medium transition-colors",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        selected ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/50 hover:bg-secondary",
        className,
      )}
    >
      {children}
    </button>
  );
}
