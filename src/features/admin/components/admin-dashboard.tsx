"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ActivityIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  IndianRupeeIcon,
  PillIcon,
  StethoscopeIcon,
  StoreIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/layout/app-header";
import { ProfileMenu } from "@/components/profile-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SessionUser } from "@/features/auth/types";
import { useAuth } from "@/hooks/use-auth";
import { errorMessage } from "@/lib/api";
import { ConsultStatusBadge, DoctorStatusBadge } from "@/features/consultations/components/status-badge";
import { listConsultations } from "@/features/consultations/repository/consultation-repository";
import { usePoll } from "@/hooks/use-poll";
import { cn, formatINR, formatTime, initials, minutesBetween } from "@/lib/utils";
import { AddDoctorForm } from "../addform/add-doctor-form";
import { fetchAdminStats, fetchDoctors, fetchStores, updateDoctor } from "../repository/directory-repository";
import type { PublicDoctor } from "../types";

/** Owner dashboard: today's numbers across all stores, consultation log, doctors and stores. */
export function AdminDashboard({ user }: { user: SessionUser }) {
  const router = useRouter();
  const { logout } = useAuth();
  const stats = usePoll(fetchAdminStats, 5000);
  const consults = usePoll(() => listConsultations({ today: "1" }), 5000);
  const doctors = usePoll(fetchDoctors, 8000);
  const stores = usePoll(fetchStores, 30_000);
  const [storeFilter, setStoreFilter] = useState("all");

  const s = stats.data?.today;
  const list = (consults.data ?? []).filter((c) => storeFilter === "all" || c.storeId === storeFilter);

  async function signOut() {
    await logout();
    router.replace("/login");
  }

  async function setActive(d: PublicDoctor, isActive: boolean) {
    try {
      await updateDoctor(d.id, { isActive });
      toast.success(isActive ? `${d.name} can sign in again` : `${d.name} can no longer sign in`);
      doctors.refresh();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <>
      <AppHeader sub="Owner dashboard">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/pharmacy">
            <PillIcon /> <span className="hidden sm:inline">Pharmacy counter</span>
          </Link>
        </Button>
        <ProfileMenu
          name={user.fullName || "Owner"}
          subtitle="Administrator"
          onRefresh={() => {
            stats.refresh();
            consults.refresh();
            doctors.refresh();
            stores.refresh();
          }}
          onSignOut={signOut}
        />
      </AppHeader>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 p-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Kpi icon={UsersIcon} label="Consultations" value={s?.total ?? "—"} />
          <Kpi icon={CheckCircle2Icon} label="Completed" value={s?.completed ?? "—"} />
          <Kpi icon={ActivityIcon} label="Live now" value={s ? `${s.inCall} in call · ${s.waiting} waiting` : "—"} small />
          <Kpi icon={ClockIcon} label="Avg. wait" value={s ? `${s.avgWaitMin} min` : "—"} />
          <Kpi icon={StethoscopeIcon} label="Doctors online" value={stats.data ? `${stats.data.doctorsOnline} / ${stats.data.doctorsTotal}` : "—"} />
          <Kpi icon={IndianRupeeIcon} label="Consult fees" value={s ? formatINR(s.consultationFees) : "—"} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <Card className="gap-4">
            <CardHeader>
              <CardTitle>Consultations</CardTitle>
              <CardDescription>All stores · today</CardDescription>
              <CardAction>
                <Select value={storeFilter} onValueChange={setStoreFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stores</SelectItem>
                    {(stores.data ?? []).map((st) => (
                      <SelectItem key={st.id} value={st.id}>
                        {st.name.replace(/^.*—\s*/, "")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardAction>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Token</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                        No consultations yet today.
                      </TableCell>
                    </TableRow>
                  )}
                  {list.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="pl-6 font-mono text-xs">{c.token}</TableCell>
                      <TableCell>
                        <p className="font-medium">{c.patient.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.patient.age} y · {c.patient.gender} · {c.specialty}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.store?.name.replace(/^.*—\s*/, "")}</TableCell>
                      <TableCell>{c.doctor?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-muted-foreground">{formatTime(c.createdAt)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.acceptedAt && c.endedAt ? `${minutesBetween(c.acceptedAt, c.endedAt)} min` : "—"}
                      </TableCell>
                      <TableCell className="pr-6">
                        {c.prescriptionId ? (
                          <a
                            href={`/prescription/${c.prescriptionId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          >
                            <FileTextIcon className="size-3.5" /> Rx
                          </a>
                        ) : (
                          <ConsultStatusBadge status={c.status} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="gap-4">
            <CardHeader>
              <CardTitle>By store</CardTitle>
              <CardDescription>Consultations today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(stats.data?.byStore ?? []).map((b) => {
                const max = Math.max(1, ...(stats.data?.byStore ?? []).map((x) => x.total));
                return (
                  <div key={b.storeId} className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium">{b.name.replace(/^.*—\s*/, "")}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {b.completed}/{b.total}
                        {b.waiting > 0 && <span className="ml-2 text-warning-foreground">· {b.waiting} waiting</span>}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(b.total / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="doctors">
          <TabsList>
            <TabsTrigger value="doctors">
              <StethoscopeIcon /> Doctors
            </TabsTrigger>
            <TabsTrigger value="stores">
              <StoreIcon /> Stores
            </TabsTrigger>
          </TabsList>
          <TabsContent value="doctors">
            <Card className="gap-4">
              <CardHeader>
                <CardTitle>Doctor panel</CardTitle>
                <CardDescription>Availability updates live from the doctor console.</CardDescription>
                <CardAction>
                  <AddDoctorForm onAdded={doctors.refresh} />
                </CardAction>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Doctor</TableHead>
                      <TableHead>Specialty</TableHead>
                      <TableHead>Reg. No.</TableHead>
                      <TableHead>Languages</TableHead>
                      <TableHead>Mobile (login)</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="pr-6">Can sign in</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(doctors.data ?? []).map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-primary/15 text-xs text-primary">{initials(d.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{d.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {d.qualification} · {d.experienceYears} yrs
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{d.specialty}</TableCell>
                        <TableCell className="font-mono text-xs">{d.registrationNo}</TableCell>
                        <TableCell className="text-muted-foreground">{d.languages.join(", ")}</TableCell>
                        <TableCell className="font-mono text-xs">{d.phone}</TableCell>
                        <TableCell>{formatINR(d.fee)}</TableCell>
                        <TableCell>
                          {d.isActive === false ? <Badge variant="outline">Disabled</Badge> : <DoctorStatusBadge status={d.status} />}
                        </TableCell>
                        <TableCell className="pr-6">
                          <Switch
                            checked={d.isActive !== false}
                            onCheckedChange={(v) => setActive(d, v)}
                            aria-label={`Allow ${d.name} to sign in`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="stores">
            <Card className="gap-4">
              <CardHeader>
                <CardTitle>Stores</CardTitle>
                <CardDescription>
                  From the Gladskin billing system. Each store&apos;s tablet runs the MedConnect app, signed in with that
                  store&apos;s staff login.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Store</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Drug licence</TableHead>
                      <TableHead className="pr-6">Phone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(stores.data ?? []).map((st) => (
                      <TableRow key={st.id}>
                        <TableCell className="pl-6">
                          <p className="font-medium">{st.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {[st.address, st.city].filter(Boolean).join(", ")}
                          </p>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{st.code}</TableCell>
                        <TableCell className="font-mono text-xs">{st.drugLicenseNo || "—"}</TableCell>
                        <TableCell className="pr-6 text-muted-foreground">{st.phone}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

    </>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  small,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  small?: boolean;
}) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="px-4">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="size-3.5" /> {label}
        </p>
        <p className={cn("mt-1 font-semibold tracking-tight tabular-nums", small ? "text-base" : "text-2xl")}>{value}</p>
      </CardContent>
    </Card>
  );
}
