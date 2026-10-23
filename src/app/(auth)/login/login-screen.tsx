"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2Icon } from "lucide-react";

import { OtpLoginForm } from "@/components/auth/otp-login-form";
import { Logo } from "@/components/layout/brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_HOME } from "@/features/auth/components/role-guard";
import type { SessionUser } from "@/features/auth/types";
import { useAuth } from "@/hooks/use-auth";

/** One sign-in for everyone. The backend decides where you go (doctor / pharmacy / owner). */
export function LoginScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { status, user } = useAuth();

  const go = (u: SessionUser) => {
    const next = params.get("next");
    router.replace(next && next.startsWith("/") && next !== "/login" ? next : ROLE_HOME[u.kind]);
  };

  useEffect(() => {
    if (status === "authenticated" && user) router.replace(ROLE_HOME[user.kind]);
  }, [status, user, router]);

  return (
    <main className="bg-grid flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="gap-4">
          <Logo />
          <div className="space-y-1.5">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              Doctors, pharmacy staff and the owner sign in with their registered mobile number.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {status === "anonymous" ? (
            <OtpLoginForm onSuccess={go} />
          ) : (
            <div className="flex justify-center py-8 text-muted-foreground">
              <Loader2Icon className="size-6 animate-spin" />
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
