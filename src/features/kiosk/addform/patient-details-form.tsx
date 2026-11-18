"use client";

import { FormField } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";
import type { KioskForm } from "../types";
import { Chip } from "../components/step-shell";

const GENDERS = ["Male", "Female", "Other"] as const;

/** Step 1 — who is the patient (+ vitals the pharmacist can measure). */
export function PatientDetailsForm({
  form,
  update,
  updateVitals,
}: {
  form: KioskForm;
  update: (patch: Partial<KioskForm>) => void;
  updateVitals: (patch: Partial<KioskForm["vitals"]>) => void;
}) {
  const big = "h-12 text-base md:text-lg";
  return (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Patient's full name" htmlFor="k-name" className="md:col-span-2">
          <Input
            id="k-name"
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            autoComplete="off"
            placeholder="e.g. Meera Nayak"
            className={big}
            autoFocus
          />
        </FormField>
        <FormField label="Age (years)" htmlFor="k-age">
          <Input
            id="k-age"
            inputMode="numeric"
            value={form.age}
            onChange={(e) => update({ age: e.target.value.replace(/\D/g, "").slice(0, 3) })}
            placeholder="34"
            className={big}
          />
        </FormField>
        <FormField label="Mobile number" htmlFor="k-phone" hint="For the prescription and follow-up">
          <Input
            id="k-phone"
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => update({ phone: e.target.value.replace(/[^\d ]/g, "").slice(0, 14) })}
            placeholder="98450 12345"
            className={big}
          />
        </FormField>
        <div className="space-y-2 md:col-span-2">
          <p className="text-sm font-medium" id="k-gender">
            Gender
          </p>
          <div className="grid grid-cols-3 gap-3" role="group" aria-labelledby="k-gender">
            {GENDERS.map((g) => (
              <Chip key={g} selected={form.gender === g} onClick={() => update({ gender: g })} className="text-center">
                {g}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border bg-muted/30 p-4">
        <div>
          <p className="font-medium">Vitals (optional)</p>
          <p className="text-sm text-muted-foreground">The pharmacist can measure these — the doctor sees them during the call.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <FormField label="BP (mmHg)" htmlFor="k-bp">
            <Input id="k-bp" value={form.vitals.bp} onChange={(e) => updateVitals({ bp: e.target.value.slice(0, 12) })} placeholder="120/80" />
          </FormField>
          <FormField label="Pulse (bpm)" htmlFor="k-pulse">
            <Input id="k-pulse" inputMode="numeric" value={form.vitals.pulse} onChange={(e) => updateVitals({ pulse: e.target.value.slice(0, 6) })} placeholder="72" />
          </FormField>
          <FormField label="Temp (°F)" htmlFor="k-temp">
            <Input id="k-temp" inputMode="decimal" value={form.vitals.temperature} onChange={(e) => updateVitals({ temperature: e.target.value.slice(0, 6) })} placeholder="98.6" />
          </FormField>
          <FormField label="SpO₂ (%)" htmlFor="k-spo2">
            <Input id="k-spo2" inputMode="numeric" value={form.vitals.spo2} onChange={(e) => updateVitals({ spo2: e.target.value.slice(0, 6) })} placeholder="98" />
          </FormField>
          <FormField label="Weight (kg)" htmlFor="k-weight">
            <Input id="k-weight" inputMode="decimal" value={form.vitals.weight} onChange={(e) => updateVitals({ weight: e.target.value.slice(0, 6) })} placeholder="62" />
          </FormField>
        </div>
      </div>
    </div>
  );
}
