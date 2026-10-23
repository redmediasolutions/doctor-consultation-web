"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2Icon,
  ClockIcon,
  PackageCheckIcon,
  StethoscopeIcon,
  Undo2Icon,
  VideoIcon,
} from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/layout/app-header";
import { EmptyState } from "@/components/empty-state";
import { PrintPrescriptionButton } from "@/components/export/print-button";
import { ProfileMenu } from "@/components/profile-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PublicStore } from "@/features/admin/types";
import type { SessionUser } from "@/features/auth/types";
import { useAuth } from "@/hooks/use-auth";
import { errorMessage } from "@/lib/api";
import { ConsultStatusBadge } from "@/features/consultations/components/status-badge";
import { listConsultations } from "@/features/consultations/repository/consultation-repository";
import { usePoll } from "@/hooks/use-poll";
import { formatTime, shortStore, timeAgo } from "@/lib/utils";
import { listPrescriptions, setDispensed as saveDispensed } from "../repository/prescription-repository";
import type { PrescriptionWithRefs } from "../types";
import { PrescriptionView } from "./prescription-view";

/** Pharmacy counter: today's prescriptions for this store + who is at the kiosk. */
export function PharmacyCounter({ store, user, storePicker }: { store: PublicStore; user: SessionUser; storePicker?: React.ReactNode }) {
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = useState<PrescriptionWithRefs | null>(null);
  const rxs = usePoll(() => listPrescriptions({ storeId: store.id }), 4000);
  const live = usePoll(() => listConsultations({ status: "active", storeId: store.id }), 4000);

  const pending = (rxs.data ?? []).filter((r) => !r.dispensed);
  const dispensed = (rxs.data ?? []).filter((r) => r.dispensed);

  // Alert staff when a new prescription arrives.
  const known = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!rxs.data) return;
    const ids = rxs.data.map((r) => r.id);
    if (known.current) {
      const fresh = rxs.data.filter((r) => !known.current!.has(r.id));
      fresh.forEach((r) => toast.success(`New prescription · Token ${r.token}`, { description: `${r.patient.name} — ${r.doctor?.name}` }));
    }
    known.current = new Set(ids);
  }, [rxs.data]);

  async function setDispensed(rx: PrescriptionWithRefs, value: boolean) {
    try {
      const updated = await saveDispensed(rx.id, value);
      if (open?.id === rx.id) setOpen(updated);
      rxs.refresh();
      toast.success(value ? `Token ${rx.token} marked as dispensed` : "Moved back to pending");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <>
      <AppHeader sub={`Counter · ${shortStore(store.name)}`}>
        {storePicker}
        <ProfileMenu
          name={user.fullName || shortStore(store.name)}
          subtitle={user.kind === "admin" ? "Administrator" : shortStore(store.name)}
          onRefresh={() => {
            rxs.refresh();
            live.refresh();
          }}
          onSignOut={async () => {
            await logout();
            router.replace("/login");
          }}
        />
      </AppHeader>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-4 p-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s prescriptions</CardTitle>
            <CardDescription>Issued by doctors for patients at this store. Updates automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList>
                <TabsTrigger value="pending">
                  To dispense {pending.length > 0 && <Badge className="ml-1 h-5 px-1.5">{pending.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="done">Dispensed ({dispensed.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="mt-3 space-y-3">
                {pending.length === 0 ? (
                  <EmptyState title="No prescriptions waiting" description="New ones pop up here automatically." />
                ) : (
                  pending.map((r) => <RxRow key={r.id} rx={r} onOpen={() => setOpen(r)} onDispense={() => setDispensed(r, true)} />)
                )}
              </TabsContent>
              <TabsContent value="done" className="mt-3 space-y-3">
                {dispensed.length === 0 ? (
                  <EmptyState title="Nothing dispensed yet today" />
                ) : (
                  dispensed.map((r) => <RxRow key={r.id} rx={r} onOpen={() => setOpen(r)} />)
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <VideoIcon className="size-4 text-primary" /> At the kiosk now
              </CardTitle>
              <CardDescription>Patients waiting or on a call.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(live.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Kiosk is free.</p>
              ) : (
                live.data!.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">
                        {c.token} · {c.patient.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.status === "in_call" ? c.doctor?.name : `waiting ${timeAgo(c.createdAt).replace(" ago", "")}`}
                      </p>
                    </div>
                    <ConsultStatusBadge status={c.status} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="gap-2 py-4">
            <CardContent className="space-y-2 px-5 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Counter checklist</p>
              <p>1. Match the token and patient name.</p>
              <p>2. Verify the doctor&apos;s registration number on the Rx.</p>
              <p>3. Collect the consultation fee, dispense, then mark as dispensed.</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-4xl sm:max-w-4xl" showCloseButton>
          <DialogTitle className="sr-only">Prescription</DialogTitle>
          {open && (
            <div className="space-y-4">
              <PrescriptionView rx={open} className="border-0 p-0 md:p-0" />
              <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                <PrintPrescriptionButton prescriptionId={open.id} />
                {open.dispensed ? (
                  <Button variant="outline" onClick={() => setDispensed(open, false)}>
                    <Undo2Icon /> Mark not dispensed
                  </Button>
                ) : (
                  <Button variant="success" onClick={() => setDispensed(open, true)}>
                    <PackageCheckIcon /> Mark dispensed
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function RxRow({ rx, onOpen, onDispense }: { rx: PrescriptionWithRefs; onOpen: () => void; onDispense?: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 md:flex-row md:items-center">
      <button onClick={onOpen} className="flex flex-1 items-start gap-4 text-left">
        <span className="flex h-12 min-w-16 flex-col items-center justify-center rounded-lg bg-secondary px-2 text-primary">
          <span className="text-[10px] font-medium uppercase opacity-70">Token</span>
          <span className="font-semibold leading-none">{rx.token}</span>
        </span>
        <span className="min-w-0 space-y-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{rx.patient.name}</span>
            <span className="text-sm text-muted-foreground">
              {rx.patient.age} y · {rx.patient.gender}
            </span>
            {rx.dispensed && (
              <Badge variant="success">
                <CheckCircle2Icon /> Dispensed {formatTime(rx.dispensedAt)}
              </Badge>
            )}
          </span>
          <span className="block text-sm">
            {rx.medicines.length} medicine{rx.medicines.length !== 1 && "s"}
            <span className="text-muted-foreground"> — {rx.medicines.map((m) => m.name).join(", ") || "advice only"}</span>
          </span>
          <span className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <StethoscopeIcon className="size-3" /> {rx.doctor?.name}
            </span>
            <span className="flex items-center gap-1">
              <ClockIcon className="size-3" /> {formatTime(rx.createdAt)}
            </span>
            <span>{rx.rxNo}</span>
          </span>
        </span>
      </button>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onOpen}>
          View
        </Button>
        {onDispense && (
          <Button variant="success" onClick={onDispense}>
            <PackageCheckIcon /> Dispense
          </Button>
        )}
      </div>
    </div>
  );
}
