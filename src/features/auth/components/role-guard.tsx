"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import type { SessionUser, UserKind } from "../types";

/** Where each kind of user lands after signing in. */
export const ROLE_HOME: Record<UserKind, string> = { doctor: "/doctor", staff: "/pharmacy", admin: "/admin" };

/**
 * Renders children only when signed in as one of `kinds`.
 * Not signed in → /login. Signed in as someone else → their own home screen.
 */
export function RoleGuard({ kinds, children }: { kinds: UserKind[]; children: (user: SessionUser) => React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useAuth();
  const allowed = status === "authenticated" && user && kinds.includes(user.kind);

  useEffect(() => {
    if (status === "anonymous") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (status === "authenticated" && user && !kinds.includes(user.kind)) router.replace(ROLE_HOME[user.kind]);
  }, [status, user, kinds, router, pathname]);

  if (!allowed) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground">
        <Loader2Icon className="size-6 animate-spin" />
      </div>
    );
  }
  return <>{children(user)}</>;
}
