"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/confirm-dialog";
import type { PublicStore } from "@/features/admin/types";
import type { SessionUser } from "@/features/auth/types";
import { useAuth } from "@/hooks/use-auth";
import { PatientDetailsForm } from "../addform/patient-details-form";
import { SymptomsForm } from "../addform/symptoms-form";
import { useKiosk } from "../hooks/use-kiosk";
import { CallStep } from "./call-step";
import { DoneStep } from "./done-step";
import { KioskHeader } from "./kiosk-header";
import { ReviewStep } from "./review-step";
import { StepShell } from "./step-shell";
import { WaitingStep } from "./waiting-step";
import { WelcomeStep } from "./welcome-step";

type Confirm = null | "cancel" | "leave" | "signout" | "store";

/**
 * Web version of the store kiosk (same flow as the Flutter tablet app).
 * Runs in the browser on a store PC / tablet, signed in with the store's staff login.
 */
export function KioskScreen({ store, user, onChangeStore }: { store: PublicStore; user: SessionUser; onChangeStore?: () => void }) {
  const router = useRouter();
  const { logout } = useAuth();
  const k = useKiosk(store.id);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const busy = k.step === "waiting" || k.step === "call";

  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void document.documentElement.requestFullscreen?.().catch(() => undefined);
  }, []);

  const signOut = useCallback(async () => {
    await k.reset();
    await logout();
    router.replace("/login");
  }, [k, logout, router]);

  const changeStore = useCallback(async () => {
    await k.reset();
    onChangeStore?.();
  }, [k, onChangeStore]);

  let body: React.ReactNode;
  switch (k.step) {
    case "welcome":
      body = <WelcomeStep store={store} onlineCount={k.onlineDoctors.length} doctorsLoaded={k.doctorsLoaded} onStart={k.start} />;
      break;
    case "details":
      body = (
        <StepShell
          index={0}
          title="Patient details"
          description="Who is the consultation for?"
          onBack={k.back}
          onNext={k.next}
          nextDisabled={!k.detailsValid}
        >
          <PatientDetailsForm form={k.form} update={k.update} updateVitals={k.updateVitals} />
        </StepShell>
      );
      break;
    case "symptoms":
      body = (
        <StepShell
          index={1}
          title="What's bothering you?"
          description="This helps the doctor prepare before the call."
          onBack={k.back}
          onNext={k.next}
          nextDisabled={!k.symptomsValid}
        >
          <SymptomsForm
            form={k.form}
            update={k.update}
            toggleSymptom={k.toggleSymptom}
            availableDoctors={k.availableDoctors}
            onlineDoctors={k.onlineDoctors}
          />
        </StepShell>
      );
      break;
    case "review":
      body = (
        <StepShell
          index={2}
          title="Review & start"
          description="Check the details, look at the camera, and agree to the consultation."
          onBack={k.back}
          onNext={() => void k.submit()}
          nextLabel={k.submitting ? "Starting…" : "Start consultation"}
          nextDisabled={!k.canSubmit}
          nextPending={k.submitting}
          footerNote={
            !k.camera.ready ? (
              <span className="hidden text-sm text-muted-foreground sm:inline">Camera needed</span>
            ) : !k.form.consent ? (
              <span className="hidden text-sm text-muted-foreground sm:inline">Tick the consent box</span>
            ) : null
          }
        >
          <ReviewStep k={k} />
        </StepShell>
      );
      break;
    case "waiting":
      body = <WaitingStep k={k} onCancel={() => setConfirm("cancel")} />;
      break;
    case "call":
      body = <CallStep k={k} onLeave={() => setConfirm("leave")} />;
      break;
    case "done":
      body = <DoneStep k={k} />;
      break;
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <KioskHeader
        store={store}
        user={user}
        onlineCount={k.onlineDoctors.length}
        fullscreen={fullscreen}
        onToggleFullscreen={toggleFullscreen}
        onSignOut={() => (busy ? setConfirm("signout") : void signOut())}
        onChangeStore={onChangeStore ? () => (busy ? setConfirm("store") : void changeStore()) : undefined}
      />
      <main className="flex flex-1 flex-col">{body}</main>

      <ConfirmDialog
        open={confirm === "cancel"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Cancel your request?"
        description="You will leave the queue. You can start again any time."
        confirmLabel="Cancel request"
        cancelLabel="Keep waiting"
        destructive
        onConfirm={() => {
          setConfirm(null);
          void k.cancelWaiting();
        }}
      />
      <ConfirmDialog
        open={confirm === "leave"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Leave the consultation?"
        description="The doctor hasn't finished yet. If you leave now, the consultation ends without a prescription."
        confirmLabel="Leave"
        cancelLabel="Stay"
        destructive
        onConfirm={() => {
          setConfirm(null);
          void k.leaveCall();
        }}
      />
      <ConfirmDialog
        open={confirm === "signout" || confirm === "store"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="A consultation is in progress"
        description="This will cancel the current patient's consultation."
        confirmLabel={confirm === "store" ? "Cancel & change store" : "Cancel & sign out"}
        cancelLabel="Go back"
        destructive
        onConfirm={() => {
          const what = confirm;
          setConfirm(null);
          void (async () => {
            const id = k.consultation?.id;
            if (id) await k.cancelWaiting();
            if (what === "store") await changeStore();
            else await signOut();
          })();
        }}
      />
    </div>
  );
}
