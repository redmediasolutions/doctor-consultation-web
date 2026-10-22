import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "./brand";

/** Sticky top bar used by the doctor, pharmacy and owner screens. */
export function AppHeader({ sub, children }: { sub: string; children?: React.ReactNode }) {
  return (
    <header className="no-print sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-2.5">
        <Logo sub={sub} href={null} />
        <div className="flex items-center gap-2">
          {children}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
