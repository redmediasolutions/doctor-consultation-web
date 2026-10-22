"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LayoutDashboardIcon, PillIcon, StethoscopeIcon } from "lucide-react";

import { PinLoginForm } from "@/components/auth/pin-login-form";
import { Logo } from "@/components/layout/brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROLE_HOME } from "@/features/auth/components/role-guard";
import type { Role } from "@/features/auth/types";

const COPY: Record<Role, { title: string; description: string }> = {
  doctor: { title: "Doctor console", description: "See patients waiting at the stores and consult over video." },
  staff: { title: "Pharmacy counter", description: "Receive prescriptions issued to your store." },
  admin: { title: "Owner dashboard", description: "Consultations, doctors and stores across the chain." },
};

export function LoginScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("role");
  const role: Role = raw === "staff" || raw === "admin" ? raw : "doctor";

  return (
    <main className="bg-grid flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="gap-4">
          <Logo />
          <Tabs value={role} onValueChange={(v) => router.replace(`/login?role=${v}`)}>
            <TabsList className="w-full">
              <TabsTrigger value="doctor">
                <StethoscopeIcon /> Doctor
              </TabsTrigger>
              <TabsTrigger value="staff">
                <PillIcon /> Pharmacy
              </TabsTrigger>
              <TabsTrigger value="admin">
                <LayoutDashboardIcon /> Owner
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="space-y-1.5">
            <CardTitle className="text-xl">{COPY[role].title}</CardTitle>
            <CardDescription>{COPY[role].description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <PinLoginForm key={role} role={role} onSuccess={() => router.replace(ROLE_HOME[role])} />
        </CardContent>
      </Card>
    </main>
  );
}
