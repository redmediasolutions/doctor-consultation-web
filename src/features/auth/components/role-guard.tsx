"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";

import { useSession } from "@/hooks/use-session";
import type { Role } from "../types";

export const ROLE_HOME: Record<Role, string> = { doctor: "/doctor", staff: "/pharmacy", admin: "/admin" };

/** Renders children only when signed in as [role]; otherwise sends the user to /login. */
export function RoleGuard<P>({ role, children }: { role: Role; children: (profile: P) => React.ReactNode }) {
  const router = useRouter();
  const { ready, profile } = useSession<P>(role);

  useEffect(() => {
    if (ready && !profile) router.replace(`/login?role=${role}`);
  }, [ready, profile, role, router]);

  if (!ready || !profile) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground">
        <Loader2Icon className="size-6 animate-spin" />
      </div>
    );
  }
  return <>{children(profile)}</>;
}
