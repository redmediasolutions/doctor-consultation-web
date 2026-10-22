"use client";

import { useState } from "react";
import { AlertTriangleIcon, Loader2Icon, PlusIcon, SendIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FREQUENCIES, TIMINGS } from "../lib/constants";
import { COMMON_MEDICINES } from "../lib/medicines";
import type { Medicine, PrescriptionDraft } from "@/features/prescriptions/types";
import type { ConsultationWithRefs } from "../types";

const blank = (): Medicine => ({
  name: "",
  dosage: "",
  frequency: "1-0-1",
  timing: "After food",
  duration: "5 days",
  quantity: "",
  instructions: "",
});

export type RxDraft = PrescriptionDraft;

export function emptyDraft(c: ConsultationWithRefs): RxDraft {
  return {
    diagnosis: "",
    chiefComplaint: [c.symptoms.join(", "), c.complaint].filter(Boolean).join(" — ") + (c.duration ? ` (${c.duration})` : ""),
    medicines: [blank()],
    investigations: "",
    advice: "",
    followUp: "",
  };
}

export function RxForm({
  draft,
  onChange,
  onSubmit,
  submitting,
}: {
  draft: RxDraft;
  onChange: (d: RxDraft) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const [touched, setTouched] = useState(false);
  const setMed = (i: number, patch: Partial<Medicine>) =>
    onChange({ ...draft, medicines: draft.medicines.map((m, idx) => (idx === i ? { ...m, ...patch } : m)) });

  const valid = draft.diagnosis.trim() && (draft.medicines.some((m) => m.name.trim()) || draft.advice.trim());

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (valid) onSubmit();
      }}
    >
      <datalist id="med-suggestions">
        {COMMON_MEDICINES.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <div className="space-y-2">
        <Label htmlFor="cc">Chief complaints</Label>
        <Textarea id="cc" value={draft.chiefComplaint} onChange={(e) => onChange({ ...draft, chiefComplaint: e.target.value })} className="min-h-14" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dx">
          Provisional diagnosis <span className="text-destructive">*</span>
        </Label>
        <Input
          id="dx"
          value={draft.diagnosis}
          onChange={(e) => onChange({ ...draft, diagnosis: e.target.value })}
          placeholder="e.g. Acute viral upper respiratory infection"
          aria-invalid={touched && !draft.diagnosis.trim()}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Medicines</Label>
          <Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...draft, medicines: [...draft.medicines, blank()] })}>
            <PlusIcon /> Add medicine
          </Button>
        </div>
        {draft.medicines.map((m, i) => (
          <div key={i} className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <div className="flex gap-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-sm font-medium text-muted-foreground">
                {i + 1}
              </span>
              <Input
                list="med-suggestions"
                value={m.name}
                onChange={(e) => setMed(i, { name: e.target.value })}
                placeholder="Medicine name & strength"
                className="bg-background"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Remove medicine"
                onClick={() => onChange({ ...draft, medicines: draft.medicines.filter((_, idx) => idx !== i) })}
                disabled={draft.medicines.length === 1}
              >
                <Trash2Icon />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Select value={m.frequency} onValueChange={(v) => setMed(i, { frequency: v })}>
                <SelectTrigger className="w-full bg-background" aria-label="Frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={m.timing} onValueChange={(v) => setMed(i, { timing: v })}>
                <SelectTrigger className="w-full bg-background" aria-label="Timing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMINGS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input value={m.duration} onChange={(e) => setMed(i, { duration: e.target.value })} placeholder="Duration" className="bg-background" />
              <Input value={m.quantity} onChange={(e) => setMed(i, { quantity: e.target.value })} placeholder="Qty (e.g. 10 tabs)" className="bg-background" />
            </div>
            <Input
              value={m.instructions}
              onChange={(e) => setMed(i, { instructions: e.target.value })}
              placeholder="Instructions (optional) — e.g. stop if rash appears"
              className="bg-background"
            />
          </div>
        ))}
        <p className="flex items-start gap-2 rounded-md bg-warning/15 px-3 py-2 text-xs text-warning-foreground dark:text-warning">
          <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" />
          Schedule X and NDPS-listed drugs cannot be prescribed by teleconsultation. Prescribe only what is appropriate
          without a physical examination.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="inv">Investigations</Label>
          <Textarea id="inv" value={draft.investigations} onChange={(e) => onChange({ ...draft, investigations: e.target.value })} placeholder="e.g. CBC, CRP" className="min-h-16" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adv">Advice</Label>
          <Textarea id="adv" value={draft.advice} onChange={(e) => onChange({ ...draft, advice: e.target.value })} placeholder="Rest, fluids, warm saline gargles…" className="min-h-16" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fu">Follow-up</Label>
        <Input id="fu" value={draft.followUp} onChange={(e) => onChange({ ...draft, followUp: e.target.value })} placeholder="e.g. After 3 days if fever persists, or visit a clinic in person" />
      </div>

      {touched && !valid && (
        <p className="text-sm text-destructive">Add a diagnosis and at least one medicine or advice.</p>
      )}
      <Button type="submit" size="lg" variant="success" className="w-full" disabled={submitting}>
        {submitting ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
        Issue prescription &amp; end consultation
      </Button>
    </form>
  );
}
