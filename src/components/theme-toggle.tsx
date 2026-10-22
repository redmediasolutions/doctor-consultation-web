"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const EVENT = "mc-theme";

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

/** Light / dark switch. The choice is saved per browser. */
export function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("mc.theme", next ? "dark" : "light");
    } catch {
      /* storage unavailable */
    }
    window.dispatchEvent(new Event(EVENT));
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
      {dark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
