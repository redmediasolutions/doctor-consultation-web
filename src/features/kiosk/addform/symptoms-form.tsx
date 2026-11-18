"use client";

import { FormField } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PublicDoctor } from "@/features/admin/types";
import { SPECIALTIES } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Chip } from "../components/step-shell";
import { COMMON_SYMPTOMS, DURATIONS } from "../lib/constants";
import type { KioskForm } from "../types";

/** Step 2 — what's wrong, since when, which kind of doctor. */
export function SymptomsForm({
  form,
  update,
  toggleSymptom,
  availableDoctors,
  onlineDoctors,
}: {
  form: KioskForm;
  update: (patch: Partial<KioskForm>) => void;
  toggleSymptom: (s: string) => void;
  availableDoctors: PublicDoctor[];
  onlineDoctors: PublicDoctor[];
}) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="font-medium">Tap everything that applies</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {COMMON_SYMPTOMS.map((s) => (
            <Chip key={s} selected={form.symptoms.includes(s)} onClick={() => toggleSymptom(s)}>
              {s}
            </Chip>
          ))}
        </div>
      </section>

      <FormField label="Describe the problem (optional)" htmlFor="k-complaint">
        <Textarea
          id="k-complaint"
          value={form.complaint}
          onChange={(e) => update({ complaint: e.target.value.slice(0, 1000) })}
          placeholder="e.g. Fever since yesterday night, headache in the morning"
          className="min-h-24 text-base"
        />
      </FormField>

      <section className="space-y-3">
        <p className="font-medium">Since when?</p>
        <div className="flex flex-wrap gap-3">
          {DURATIONS.map((d) => (
            <Chip key={d} selected={form.duration === d} onClick={() => update({ duration: form.duration === d ? "" : d })}>
              {d}
            </Chip>
          ))}
        </div>
      </section>

      <FormField label="Any allergies? (optional)" htmlFor="k-allergies">
        <Input
          id="k-allergies"
          value={form.allergies}
          onChange={(e) => update({ allergies: e.target.value.slice(0, 200) })}
          placeholder="e.g. Penicillin"
          className="h-12 text-base"
        />
      </FormField>

      <section className="space-y-3">
        <p className="font-medium">Which doctor would you like to see?</p>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {SPECIALTIES.map((s) => {
            const free = availableDoctors.some((d) => d.specialty === s);
            const busy = !free && onlineDoctors.some((d) => d.specialty === s);
            return (
              <Chip key={s} selected={form.specialty === s} onClick={() => update({ specialty: s })}>
                <span className="block">{s}</span>
                <span
                  className={cn(
                    "mt-0.5 flex items-center gap-1.5 text-xs font-normal",
                    form.specialty === s ? "text-primary-foreground/85" : "text-muted-foreground",
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", free ? "bg-success" : busy ? "bg-warning" : "bg-muted-foreground/40")} />
                  {free ? "Available now" : busy ? "Busy — short wait" : "No doctor online"}
                </span>
              </Chip>
            );
          })}
        </div>
      </section>
    </div>
  );
}
