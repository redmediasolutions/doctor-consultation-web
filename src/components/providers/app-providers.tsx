"use client";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "./auth-provider";

/** App-wide client providers. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-center" />
    </AuthProvider>
  );
}
