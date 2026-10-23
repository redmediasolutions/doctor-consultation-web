"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ActivityIcon,
  AlertCircleIcon,
  ClipboardListIcon,
  ClockIcon,
  FileTextIcon,
  HistoryIcon,
  MapPinIcon,
  MessageSquareIcon,
  PhoneOffIcon,
  RefreshCwIcon,
  UserRoundIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { PrintPrescriptionButton } from "@/components/export/print-button";
import { AppHeader } from "@/components/layout/app-header";
import { ProfileMenu } from "@/components/profile-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PublicDoctor } from "@/features/admin/types";
import { useAuth } from "@/hooks/use-auth";
import { usePoll } from "@/hooks/use-poll";
import { ApiError, errorMessage } from "@/lib/api";
import { cn, formatTime, minutesBetween } from "@/lib/utils";
import { emptyDraft, RxForm, type RxDraft } from "../addform/rx-form";
import { useAgoraCall } from "../hooks/use-agora-call";
import { chime } from "../lib/chime";
import {
  acceptConsultation,
  doctorRtcCredentials,
  endConsultation,
  getConsultation,
  issuePrescription,
  listConsultations,
  sendHeartbeat,
} from "../repository/consultation-repository";
import type { ChatMessage, ConsultationWithRefs } from "../types";
import { ChatPanel } from "./chat-panel";
import { PatientSummary } from "./patient-summary";
import { QueueItem } from "./queue-item";
import { Stat } from "./stat-tile";
import { ConsultStatusBadge } from "./status-badge";
import { AgoraVideo, VideoStage } from "./video-stage";

const AVAILABLE_KEY = "mc.doctor.available";

export function DoctorConsole({ doctor }: { doctor: PublicDoctor }) {
  const router = useRouter();
  const { logout } = useAuth();
  const call = useAgoraCall();
  const [available, setAvailable] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AVAILABLE_KEY) !== "0";
    } catch {
      return true;
    }
  });
  const [active, setActive] = useState<ConsultationWithRefs | null>(null);
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState<RxDraft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [tab, setTab] = useState("patient");
  const [unread, setUnread] = useState(false);

  /* ------------------------------ presence ------------------------------ */
  const status = active ? "busy" : available ? "online" : "offline";
  useEffect(() => {
    try {
      localStorage.setItem(AVAILABLE_KEY, available ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
  }, [available]);

  useEffect(() => {
    const beat = () =>
      sendHeartbeat(status).catch((e) => {
        if (e instanceof ApiError && e.status === 401) router.replace("/login");
      });
    beat();
    const t = setInterval(beat, 15_000);
    return () => clearInterval(t);
  }, [status, router]);

  /* -------------------------------- data -------------------------------- */
  const queue = usePoll(() => listConsultations({ status: "active" }), 3000);
  const history = usePoll(() => listConsultations({ doctorId: "me", today: "1" }), 15_000);

  const waiting = useMemo(
    () =>
      (queue.data ?? [])
        .filter((c) => c.status === "waiting")
        .filter((c) => filter === "all" || c.specialty === doctor.specialty)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [queue.data, filter, doctor.specialty],
  );
  const mineInCall = (queue.data ?? []).find((c) => c.status === "in_call" && c.doctorId === doctor.id);

  // Chime + toast on new patients.
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!queue.data) return;
    const ids = waiting.map((w) => w.id);
    if (seen.current) {
      const fresh = ids.filter((id) => !seen.current!.has(id));
      if (fresh.length && available && !active) {
        toast.info(fresh.length === 1 ? "New patient waiting" : `${fresh.length} new patients waiting`);
        chime();
      }
    } else {
      seen.current = new Set();
    }
    ids.forEach((id) => seen.current!.add(id));
  }, [queue.data, waiting, available, active]);

  /* ------------------------------ camera -------------------------------- */
  const { startPreview, stopPreview } = call;
  useEffect(() => {
    if (available || active) startPreview().catch(() => undefined);
    else stopPreview();
  }, [available, active, startPreview, stopPreview]);

  // Chat from the patient (Agora data stream).
  const { onMessage } = call;
  useEffect(() => {
    onMessage((m) => {
      setMessages((prev) => [...prev, m]);
      setUnread(true);
      toast.message("Message from patient", { description: m.text });
    });
    return () => onMessage(null);
  }, [onMessage]);

  /* -------------------------------- call -------------------------------- */
  const connect = useCallback(
    async (c: ConsultationWithRefs) => {
      try {
        const creds = await doctorRtcCredentials(c.id);
        await call.join(creds, () => doctorRtcCredentials(c.id));
      } catch (e) {
        toast.error(errorMessage(e) || "Could not start the video call");
      }
    },
    [call],
  );

  const closeConsult = useCallback(async () => {
    await call.leave();
    setActive(null);
    setDraft(null);
    setMessages([]);
    setTab("patient");
    setUnread(false);
    queue.refresh();
    history.refresh();
  }, [call, queue, history]);

  function openConsult(c: ConsultationWithRefs) {
    setActive(c);
    setDraft(emptyDraft(c));
    setMessages([]);
    setTab("patient");
    connect(c);
  }

  async function accept(c: ConsultationWithRefs) {
    try {
      openConsult(await acceptConsultation(c.id));
    } catch (e) {
      toast.error(errorMessage(e));
      queue.refresh();
    }
  }

  async function issueRx() {
    if (!active || !draft) return;
    setSubmitting(true);
    try {
      const rx = await issuePrescription(active.id, draft);
      toast.success(`Prescription ${rx.rxNo} sent to ${active.store?.name ?? "the store"}`);
      await closeConsult();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function endWithoutRx() {
    if (!active) return;
    try {
      await endConsultation(active.id);
    } catch (e) {
      toast.error(errorMessage(e));
    }
    setConfirmEnd(false);
    await closeConsult();
  }

  // Patient left / kiosk cancelled → close out.
  useEffect(() => {
    if (!active || !queue.data) return;
    if (queue.data.some((c) => c.id === active.id)) return;
    getConsultation(active.id)
      .then((c) => {
        if (c.status === "cancelled") {
          toast.warning(`${c.patient.name} left the consultation`);
          closeConsult();
        }
      })
      .catch(() => undefined);
  }, [queue.data, active, closeConsult]);

  function sendChat(text: string) {
    const m: ChatMessage = { from: "doctor", text: text.slice(0, 400), at: new Date().toISOString() };
    setMessages((prev) => [...prev, m]);
    call.sendChat(m).then((sent) => {
      if (!sent) toast.error("Message not delivered — the patient is not connected yet.");
    });
  }

  async function signOut() {
    await call.leave();
    call.stopPreview();
    await logout();
    router.replace("/login");
  }

  const done = (history.data ?? []).filter((c) => c.status === "completed");
  const connected = call.connection === "connected" && call.remoteUid !== null;

  /* --------------------------------- view -------------------------------- */
  return (
    <>
      <AppHeader sub="Doctor console">
        <label
          className={cn(
            "flex items-center gap-2.5 rounded-full border px-3 py-1.5 text-sm font-medium",
            status === "online" && "border-success/40 bg-success/10 text-success",
            status === "busy" && "border-warning/50 bg-warning/15",
          )}
        >
          <Switch checked={available} onCheckedChange={setAvailable} disabled={!!active} aria-label="Available" />
          <span className="hidden sm:inline">{status === "busy" ? "In consultation" : available ? "Available" : "Away"}</span>
        </label>
        <ProfileMenu
          name={doctor.name}
          subtitle={`${doctor.specialty} · ${doctor.registrationNo}`}
          onRefresh={() => {
            queue.refresh();
            history.refresh();
          }}
          onSignOut={signOut}
        />
      </AppHeader>

      <main className="mx-auto w-full max-w-[1500px] flex-1 p-4">
        {active ? (
          <div className="grid gap-4 xl:grid-cols-[1fr_520px]">
            <div className="space-y-3">
              <VideoStage
                className="aspect-video w-full"
                local={call.localVideo}
                remote={call.remoteVideo}
                remotePresent={call.remoteUid !== null}
                remoteLabel={active.patient.name}
                remoteSub={`${active.patient.age} y · ${active.patient.gender} · ${active.store?.name ?? ""}`}
                since={active.acceptedAt}
                connection={call.connection}
                waitingText={call.error ?? "Waiting for the store tablet to join…"}
                micOn={call.micOn}
                camOn={call.camOn}
                onToggleMic={call.toggleMic}
                onToggleCam={call.toggleCam}
                onHangUp={() => setConfirmEnd(true)}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={connected ? "success" : call.connection === "failed" ? "destructive" : "warning"}>
                  <ActivityIcon />
                  {connected ? "Connected" : call.connection === "failed" ? "Disconnected" : "Connecting"}
                </Badge>
                <Badge variant="outline">Token {active.token}</Badge>
                <Badge variant="outline">
                  <MapPinIcon /> {active.store?.name}
                </Badge>
                {(call.connection === "failed" || call.error) && (
                  <Button size="sm" variant="outline" onClick={() => connect(active)}>
                    <RefreshCwIcon /> Reconnect video
                  </Button>
                )}
              </div>
            </div>

            <Card className="gap-0 py-0 xl:max-h-[calc(100vh-110px)] xl:overflow-hidden">
              <Tabs
                value={tab}
                onValueChange={(v) => {
                  setTab(v);
                  if (v === "chat") setUnread(false);
                }}
                className="flex h-full min-h-0 flex-col gap-0"
              >
                <div className="border-b p-3">
                  <TabsList className="w-full">
                    <TabsTrigger value="patient">
                      <UserRoundIcon /> Patient
                    </TabsTrigger>
                    <TabsTrigger value="rx">
                      <FileTextIcon /> Prescription
                    </TabsTrigger>
                    <TabsTrigger value="chat">
                      <MessageSquareIcon /> Chat
                      {unread && tab !== "chat" && <span className="size-1.5 rounded-full bg-primary" />}
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="patient" className="min-h-0 overflow-y-auto p-5">
                  <PatientSummary c={active} />
                  <Button className="mt-5 w-full" onClick={() => setTab("rx")}>
                    <FileTextIcon /> Write prescription
                  </Button>
                </TabsContent>
                <TabsContent value="rx" className="min-h-0 overflow-y-auto p-5">
                  {draft && <RxForm draft={draft} onChange={setDraft} onSubmit={issueRx} submitting={submitting} />}
                </TabsContent>
                <TabsContent value="chat" className="flex min-h-[420px] flex-col">
                  <ChatPanel className="flex-1" messages={messages} me="doctor" onSend={sendChat} disabled={!connected} />
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat icon={UsersIcon} label="Waiting now" value={waiting.length} tone={waiting.length ? "warning" : undefined} />
                <Stat icon={ClipboardListIcon} label="Seen today" value={done.length} />
                <Stat
                  icon={ClockIcon}
                  label="Avg. call"
                  value={
                    done.length
                      ? `${Math.round(done.reduce((s, c) => s + minutesBetween(c.acceptedAt, c.endedAt), 0) / done.length)} min`
                      : "—"
                  }
                />
                <Stat icon={FileTextIcon} label="Prescriptions" value={done.filter((c) => c.prescriptionId).length} />
              </div>

              {mineInCall && (
                <Card className="border-warning/50 bg-warning/10 py-4">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 px-5">
                    <p className="flex items-center gap-2 text-sm">
                      <AlertCircleIcon className="size-4" /> You have an unfinished consultation with{" "}
                      <strong>{mineInCall.patient.name}</strong>.
                    </p>
                    <Button size="sm" onClick={() => openConsult(mineInCall)}>
                      <VideoIcon /> Rejoin
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Patient queue</CardTitle>
                  <CardDescription>Live from all stores · oldest first</CardDescription>
                  <CardAction>
                    <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "mine")}>
                      <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="mine">{doctor.specialty}</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!available && (
                    <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                      You&apos;re set to <strong>Away</strong>. Switch to Available to appear online at the stores.
                    </p>
                  )}
                  {queue.error && !queue.data ? (
                    <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{queue.error.message}</p>
                  ) : waiting.length === 0 ? (
                    <EmptyState
                      title="No patients waiting"
                      description="New requests from the store tablets appear here automatically."
                    />
                  ) : (
                    waiting.map((c, i) => (
                      <QueueItem
                        key={c.id}
                        c={c}
                        position={i + 1}
                        mismatch={c.specialty !== doctor.specialty}
                        onAccept={() => accept(c)}
                        disabled={!!mineInCall}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="gap-3">
                <CardHeader>
                  <CardTitle className="text-base">Camera check</CardTitle>
                  <CardDescription>Patients see this when you connect.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-neutral-900">
                    {call.localVideo ? (
                      <AgoraVideo track={call.localVideo} mirror />
                    ) : (
                      <div className="flex size-full items-center justify-center p-4 text-center text-sm text-white/70">
                        {call.error ?? (available ? "Starting camera…" : "Camera off while Away")}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="gap-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <HistoryIcon className="size-4" /> Today&apos;s consultations
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  {(history.data ?? []).length === 0 ? (
                    <p className="px-6 pb-2 text-sm text-muted-foreground">None yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6">Patient</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead className="pr-6">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.data!.slice(0, 12).map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="pl-6">
                              <p className="font-medium">{c.patient.name}</p>
                              <p className="text-xs text-muted-foreground">{c.store?.city}</p>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{formatTime(c.acceptedAt ?? c.createdAt)}</TableCell>
                            <TableCell className="pr-6">
                              {c.prescriptionId ? (
                                <PrintPrescriptionButton prescriptionId={c.prescriptionId} label="Rx" variant="ghost" />
                              ) : (
                                <ConsultStatusBadge status={c.status} />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      <Dialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End without a prescription?</DialogTitle>
            <DialogDescription>
              Use this when the patient needs an in-person visit or no medicine is required. To send a prescription, use
              the Prescription tab instead — issuing it also ends the call.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmEnd(false);
                setTab("rx");
              }}
            >
              <FileTextIcon /> Write prescription
            </Button>
            <Button variant="destructive" onClick={endWithoutRx}>
              <PhoneOffIcon /> End consultation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
