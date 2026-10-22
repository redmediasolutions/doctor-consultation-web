import Link from "next/link";

import { BRAND } from "@/lib/config";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-[60%]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
        <circle cx="18.5" cy="5.5" r="2.2" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

export function Logo({ className, sub, href = "/" }: { className?: string; sub?: string; href?: string | null }) {
  const inner = (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="leading-tight">
        <span className="block text-base font-semibold tracking-tight">{BRAND.name}</span>
        {sub && <span className="block text-xs text-muted-foreground">{sub}</span>}
      </span>
    </span>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
