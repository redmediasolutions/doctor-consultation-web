import { AlertTriangleIcon, CameraIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AgoraVideo } from "@/features/consultations/components/video-stage";
import { formatINR } from "@/lib/utils";
import type { Kiosk } from "../hooks/use-kiosk";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b py-2.5 last:border-0">
      <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  );
}

/** Step 3 — check the details, camera check, consent. */
export function ReviewStep({ k }: { k: Kiosk }) {
  const f = k.form;
  const vitals = [
    f.vitals.bp && `BP ${f.vitals.bp}`,
    f.vitals.pulse && `Pulse ${f.vitals.pulse}`,
    f.vitals.temperature && `${f.vitals.temperature}°F`,
    f.vitals.spo2 && `SpO₂ ${f.vitals.spo2}%`,
    f.vitals.weight && `${f.vitals.weight} kg`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,420px)]">
      <div className="space-y-5">
        <dl className="rounded-2xl border bg-card px-5 py-2">
          <Row label="Patient" value={`${f.name.trim()}, ${f.age} yrs, ${f.gender}`} />
          <Row label="Mobile" value={f.phone} />
          <Row label="Concern" value={k.concern} />
          <Row label="Since" value={f.duration} />
          <Row label="Allergies" value={f.allergies} />
          <Row label="Vitals" value={vitals} />
          <Row label="Doctor" value={`${f.specialty}${k.feeForSpecialty ? ` · fee ${formatINR(k.feeForSpecialty)}` : ""}`} />
        </dl>

        {k.noDoctorForSpecialty && (
          <p className="flex items-start gap-2 rounded-xl bg-warning/15 px-4 py-3 text-sm">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" />
            No {f.specialty} is online right now. You can still join the queue — the next free doctor will see you.
          </p>
        )}

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border bg-card p-4">
          <Checkbox
            checked={f.consent}
            onCheckedChange={(v) => k.update({ consent: v === true })}
            className="mt-1 size-5"
            aria-label="I agree to the teleconsultation"
          />
          <span className="text-sm leading-relaxed">
            I agree to consult a registered doctor over video. I understand this is a teleconsultation, the doctor may
            advise an in-person visit, and my details are shared with the doctor and this pharmacy only.
          </span>
        </label>
      </div>

      <div className="space-y-3">
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-neutral-950 ring-1 ring-black/10">
          {k.call.localVideo && <AgoraVideo track={k.call.localVideo} mirror />}
          {k.camera.ready && (
            <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
              <CheckCircle2Icon className="size-3.5 text-emerald-400" /> Camera & mic ready
            </span>
          )}
          {!k.camera.ready && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
              {k.camera.preparing ? (
                <>
                  <Loader2Icon className="size-7 animate-spin" />
                  <p className="text-sm">Starting camera…</p>
                </>
              ) : (
                <>
                  <CameraIcon className="size-7 opacity-80" />
                  <p className="text-sm">{k.camera.error ?? "Camera is off"}</p>
                  <Button variant="secondary" size="sm" onClick={() => void k.prepareCamera()}>
                    Try again
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        <p className="text-center text-sm text-muted-foreground">Sit so your face is clearly visible. Speak normally.</p>
      </div>
    </div>
  );
}
