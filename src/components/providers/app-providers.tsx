"use client";

import { Toaster } from "@/components/ui/sonner";

/** App-wide client providers. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-center" />
    </>
  );
}
