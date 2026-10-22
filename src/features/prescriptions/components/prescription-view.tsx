import { BRAND } from "@/lib/config";
import type { PrescriptionWithRefs } from "../types";
import { cn, formatDateTime } from "@/lib/utils";
import { LogoMark } from "@/components/layout/brand";

/** Printable e-prescription. Used on the kiosk, pharmacy counter and /prescription/[id]. */
export function PrescriptionView({ rx, className }: { rx: PrescriptionWithRefs; className?: string }) {
  const d = rx.doctor;
  return (
    <article className={cn("rounded-xl border bg-white p-6 text-[13px] leading-relaxed text-neutral-900 md:p-8", className)}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-primary pb-4">
        <div className="flex items-start gap-3">
          <LogoMark className="size-11" />
          <div>
            <p className="text-lg font-bold tracking-tight">{d?.name ?? "Doctor"}</p>
            <p className="text-neutral-600">{d?.qualification}</p>
            <p className="text-neutral-600">
              {d?.specialty} · Reg. No. <span className="font-medium text-neutral-800">{d?.registrationNo}</span>
            </p>
          </div>
        </div>
        <div className="text-right text-neutral-600">
          <p className="font-semibold text-neutral-900">{BRAND.name} Teleconsultation</p>
          <p>{rx.store?.name}</p>
          <p>{rx.store?.address}{rx.store?.city ? `, ${rx.store.city}` : ""}</p>
          <p>{rx.store?.phone}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-x-6 gap-y-1 border-b py-3 md:grid-cols-4">
        <Field label="Patient" value={rx.patient.name} />
        <Field label="Age / Sex" value={`${rx.patient.age} y / ${rx.patient.gender}`} />
        <Field label="Mobile" value={rx.patient.phone} />
        <Field label="Date" value={formatDateTime(rx.createdAt)} />
        <Field label="Rx No." value={rx.rxNo} />
        <Field label="Mode" value="Video consultation" />
      </section>

      {rx.chiefComplaint && (
        <section className="border-b py-3">
          <Field label="Chief complaints" value={rx.chiefComplaint} />
        </section>
      )}
      <section className="border-b py-3">
        <Field label="Provisional diagnosis" value={rx.diagnosis} strong />
      </section>

      <section className="py-4">
        <p className="mb-2 font-serif text-3xl font-bold text-primary italic">℞</p>
        {rx.medicines.length === 0 ? (
          <p className="text-neutral-500">No medicines prescribed.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left text-[11px] tracking-wide text-neutral-500 uppercase">
                <th className="py-1.5 pr-2 font-medium">#</th>
                <th className="py-1.5 pr-2 font-medium">Medicine</th>
                <th className="py-1.5 pr-2 font-medium">Frequency</th>
                <th className="py-1.5 pr-2 font-medium">When</th>
                <th className="py-1.5 pr-2 font-medium">Duration</th>
                <th className="py-1.5 font-medium">Qty</th>
              </tr>
            </thead>
            <tbody>
              {rx.medicines.map((m, i) => (
                <tr key={i} className="border-b border-dashed align-top last:border-0">
                  <td className="py-2 pr-2 text-neutral-500">{i + 1}</td>
                  <td className="py-2 pr-2">
                    <p className="font-semibold uppercase">{m.name}</p>
                    {m.dosage && <p className="text-neutral-600">{m.dosage}</p>}
                    {m.instructions && <p className="text-neutral-600 italic">{m.instructions}</p>}
                  </td>
                  <td className="py-2 pr-2 font-mono whitespace-nowrap">{m.frequency}</td>
                  <td className="py-2 pr-2">{m.timing}</td>
                  <td className="py-2 pr-2 whitespace-nowrap">{m.duration}</td>
                  <td className="py-2">{m.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {(rx.investigations || rx.advice || rx.followUp) && (
        <section className="grid gap-3 border-t py-3 md:grid-cols-2">
          {rx.investigations && <Field label="Investigations advised" value={rx.investigations} />}
          {rx.advice && <Field label="Advice" value={rx.advice} />}
          {rx.followUp && <Field label="Follow-up" value={rx.followUp} />}
        </section>
      )}

      <footer className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t pt-4 text-[11px] text-neutral-500">
        <p className="max-w-md">
          Issued after a video teleconsultation under the Telemedicine Practice Guidelines. This is an electronically
          generated prescription and is valid for a single dispensing.
        </p>
        <div className="text-right">
          <p className="font-serif text-base text-neutral-800 italic">{d?.name}</p>
          <p>Digitally signed · {d?.registrationNo}</p>
        </div>
      </footer>
    </article>
  );
}

function Field({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-[11px] tracking-wide text-neutral-500 uppercase">{label}</p>
      <p className={cn("text-neutral-900", strong && "font-semibold")}>{value || "—"}</p>
    </div>
  );
}
