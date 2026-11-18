"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useAgoraCall } from "@/features/consultations/hooks/use-agora-call";
import type { ChatMessage, ConsultationWithRefs } from "@/features/consultations/types";
import type { PrescriptionWithRefs } from "@/features/prescriptions/types";
import { usePoll } from "@/hooks/use-poll";
import { errorMessage } from "@/lib/api";
import { DOCTORS_POLL_MS, KIOSK_IDLE_MS, KIOSK_POLL_MS, KIOSK_RESET_SECONDS } from "../lib/constants";
import { kioskRepository } from "../repository/kiosk.repository";
import { emptyKioskForm, kioskService } from "../services/kiosk.service";
import type { KioskForm, KioskStep } from "../types";

type CameraState = { ready: boolean; preparing: boolean; error: string | null };
const CAMERA_IDLE: CameraState = { ready: false, preparing: false, error: null };

/**
 * The whole patient journey on the web kiosk — same flow as the Flutter kiosk:
 * welcome → details → symptoms → review (camera + consent) → waiting → video call → done.
 */
export function useKiosk(storeId: string) {
  const call = useAgoraCall();

  const [step, setStepState] = useState<KioskStep>("welcome");
  const [form, setForm] = useState<KioskForm>(emptyKioskForm);
  const [camera, setCamera] = useState<CameraState>(CAMERA_IDLE);
  const [submitting, setSubmitting] = useState(false);
  const [consultation, setConsultation] = useState<ConsultationWithRefs | null>(null);
  const [prescription, setPrescription] = useState<PrescriptionWithRefs | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unread, setUnread] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(KIOSK_RESET_SECONDS);

  // Refs for timers / async callbacks (always the latest values).
  const stepRef = useRef<KioskStep>("welcome");
  const consultationIdRef = useRef<string | null>(null);
  const joiningRef = useRef(false);

  const setStep = useCallback((next: KioskStep) => {
    stepRef.current = next;
    setStepState(next);
  }, []);

  /* ------------------------------------------------------------ doctors */
  const formSteps = step === "welcome" || step === "details" || step === "symptoms" || step === "review";
  const doctorsPoll = usePoll(kioskRepository.doctors, DOCTORS_POLL_MS, formSteps);
  const doctors = useMemo(() => doctorsPoll.data ?? [], [doctorsPoll.data]);
  const onlineDoctors = useMemo(() => doctors.filter((d) => d.status !== "offline"), [doctors]);
  const availableDoctors = useMemo(() => doctors.filter((d) => d.status === "online"), [doctors]);
  const noDoctorForSpecialty = !onlineDoctors.some((d) => d.specialty === form.specialty);
  const feeForSpecialty = [...availableDoctors, ...onlineDoctors, ...doctors].find((d) => d.specialty === form.specialty)?.fee;

  /* -------------------------------------------------------------- reset */
  const reset = useCallback(async () => {
    consultationIdRef.current = null;
    joiningRef.current = false;
    setStep("welcome");
    setForm(emptyKioskForm());
    setCamera(CAMERA_IDLE);
    setSubmitting(false);
    setConsultation(null);
    setPrescription(null);
    setMessages([]);
    setUnread(false);
    setVideoError(null);
    setCountdown(KIOSK_RESET_SECONDS);
    await call.leave();
    call.stopPreview();
  }, [call, setStep]);

  /* ------------------------------------------------------------- camera */
  const prepareCamera = useCallback(async () => {
    setCamera({ ready: false, preparing: true, error: null });
    try {
      await call.startPreview();
      setCamera({ ready: true, preparing: false, error: null });
    } catch (e) {
      setCamera({ ready: false, preparing: false, error: errorMessage(e) });
    }
  }, [call]);

  /* --------------------------------------------------------- navigation */
  const start = useCallback(() => setStep("details"), [setStep]);

  const back = useCallback(() => {
    const s = stepRef.current;
    if (s === "details") void reset();
    else if (s === "symptoms") setStep("details");
    else if (s === "review") setStep("symptoms");
  }, [reset, setStep]);

  const next = useCallback(() => {
    const s = stepRef.current;
    if (s === "details" && kioskService.detailsValid(form)) setStep("symptoms");
    else if (s === "symptoms" && kioskService.symptomsValid(form)) {
      setStep("review");
      void prepareCamera();
    }
  }, [form, prepareCamera, setStep]);

  const update = useCallback((patch: Partial<KioskForm>) => setForm((f) => ({ ...f, ...patch })), []);
  const updateVitals = useCallback(
    (patch: Partial<KioskForm["vitals"]>) => setForm((f) => ({ ...f, vitals: { ...f.vitals, ...patch } })),
    [],
  );
  const toggleSymptom = useCallback(
    (s: string) =>
      setForm((f) => ({ ...f, symptoms: f.symptoms.includes(s) ? f.symptoms.filter((x) => x !== s) : [...f.symptoms, s] })),
    [],
  );

  /* ------------------------------------------------------- consultation */
  const canSubmit = form.consent && camera.ready && !submitting;

  const submit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const c = await kioskRepository.create(kioskService.toInput(storeId, form));
      consultationIdRef.current = c.id;
      setConsultation(c);
      setStep("waiting");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, form, setStep, storeId]);

  const joinCall = useCallback(
    async (c: ConsultationWithRefs) => {
      if (joiningRef.current) return;
      joiningRef.current = true;
      setStep("call");
      setVideoError(null);
      try {
        const creds = await kioskRepository.patientRtc(c.id);
        if (consultationIdRef.current !== c.id) return; // reset meanwhile
        await call.join(creds, () => kioskRepository.patientRtc(c.id));
      } catch (e) {
        if (consultationIdRef.current === c.id) setVideoError(errorMessage(e));
      } finally {
        joiningRef.current = false;
      }
    },
    [call, setStep],
  );

  /** Rejoin the video if the connection dropped. */
  const reconnect = useCallback(async () => {
    if (consultation?.status === "in_call") await joinCall(consultation);
  }, [consultation, joinCall]);

  const finish = useCallback(
    async (c: ConsultationWithRefs) => {
      if (stepRef.current === "done") return;
      setStep("done");
      setCountdown(KIOSK_RESET_SECONDS);
      await call.leave();
      call.stopPreview();
      if (c.prescriptionId) {
        try {
          setPrescription(await kioskRepository.prescription(c.prescriptionId));
        } catch {
          setPrescription(null);
        }
      }
    },
    [call, setStep],
  );

  // Poll the consultation while waiting / in the call. Keeps running in a background tab,
  // because each check also tells the server the kiosk is still there.
  const activeId = (step === "waiting" || step === "call") && consultation ? consultation.id : null;
  const handlersRef = useRef({ joinCall, finish, reset });
  useEffect(() => {
    handlersRef.current = { joinCall, finish, reset };
  });
  useEffect(() => {
    if (!activeId) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const fresh = await kioskRepository.get(activeId);
        if (stopped || consultationIdRef.current !== activeId) return;
        setConsultation(fresh);
        const h = handlersRef.current;
        if (fresh.status === "in_call" && stepRef.current === "waiting") void h.joinCall(fresh);
        else if (fresh.status === "completed") {
          await h.finish(fresh);
          return;
        } else if (fresh.status === "cancelled") {
          toast.error(fresh.cancelReason || "The consultation was cancelled.");
          await h.reset();
          return;
        }
      } catch {
        /* network blip — try again on the next tick */
      }
      if (!stopped) timer = setTimeout(tick, KIOSK_POLL_MS);
    };
    void tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [activeId]);

  const cancelWithReason = useCallback(
    async (reason: string) => {
      const id = consultationIdRef.current;
      if (id) await kioskRepository.cancel(id, reason).catch(() => undefined);
      await reset();
    },
    [reset],
  );
  const cancelWaiting = useCallback(() => cancelWithReason("Patient cancelled while waiting"), [cancelWithReason]);
  const leaveCall = useCallback(() => cancelWithReason("Patient left the call"), [cancelWithReason]);

  /* --------------------------------------------------------------- chat */
  useEffect(() => {
    call.onMessage((m) => {
      setMessages((list) => [...list, m]);
      setUnread(true);
    });
    return () => call.onMessage(null);
  }, [call]);

  const sendChat = useCallback(
    (text: string) => {
      const t = text.trim().slice(0, 400);
      if (!t) return;
      const m: ChatMessage = { from: "patient", text: t, at: new Date().toISOString() };
      setMessages((list) => [...list, m]);
      void call.sendChat(m);
    },
    [call],
  );
  const markChatRead = useCallback(() => setUnread(false), []);

  /* ------------------------------------------------------------- timers */
  // Abandoned forms go back to the welcome screen (restarts on every change).
  useEffect(() => {
    if (step !== "details" && step !== "symptoms" && step !== "review") return;
    const t = setTimeout(() => void handlersRef.current.reset(), KIOSK_IDLE_MS);
    return () => clearTimeout(t);
  }, [step, form]);

  // "Done" screen counts down, then the kiosk resets for the next patient.
  useEffect(() => {
    if (step !== "done") return;
    let left = KIOSK_RESET_SECONDS;
    const t = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearInterval(t);
        void handlersRef.current.reset();
      } else setCountdown(left);
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  // Closing / reloading the tab mid-consultation: warn, and cancel the request.
  useEffect(() => {
    if (step !== "waiting" && step !== "call") return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const leave = () => {
      const id = consultationIdRef.current;
      if (id) kioskRepository.cancelOnUnload(id, "Kiosk closed");
    };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("pagehide", leave);
    };
  }, [step]);

  // Leaving the kiosk page inside the app (sign out, other page) also cancels an open request.
  useEffect(
    () => () => {
      const id = consultationIdRef.current;
      const s = stepRef.current;
      if (id && (s === "waiting" || s === "call")) void kioskRepository.cancel(id, "Kiosk closed").catch(() => undefined);
    },
    [],
  );

  return {
    step,
    form,
    update,
    updateVitals,
    toggleSymptom,
    detailsValid: kioskService.detailsValid(form),
    symptomsValid: kioskService.symptomsValid(form),
    concern: kioskService.concern(form),
    doctors,
    doctorsLoaded: doctorsPoll.data !== undefined,
    onlineDoctors,
    availableDoctors,
    noDoctorForSpecialty,
    feeForSpecialty,
    camera,
    prepareCamera,
    canSubmit,
    submitting,
    consultation,
    prescription,
    messages,
    unread,
    markChatRead,
    sendChat,
    videoError,
    countdown,
    call,
    start,
    back,
    next,
    submit,
    reconnect,
    cancelWaiting,
    leaveCall,
    reset,
  };
}

export type Kiosk = ReturnType<typeof useKiosk>;
