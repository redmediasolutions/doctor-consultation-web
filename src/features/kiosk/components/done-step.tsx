import { CheckCircle2Icon, PillIcon, PrinterIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PrescriptionView } from "@/features/prescriptions/components/prescription-view";
import type { Kiosk } from "../hooks/use-kiosk";

export function DoneStep({ k }: { k: Kiosk }) {
  const rx = k.prescription;
  const c = k.consultation;
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-4">
          <CheckCircle2Icon className="size-12 shrink-0 text-success" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Consultation complete</h1>
            <p className="text-muted-foreground">
              {rx ? (
                <>
                  <PillIcon className="mr-1 inline size-4" />
                  Your prescription is at the counter — show token{" "}
                  <span className="font-mono font-semibold text-foreground">{rx.token}</span>.
                </>
              ) : (
                `Thank you${c ? `, ${c.patient.name}` : ""}. Please speak to the pharmacist if you need anything.`
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {rx && (
            <Button variant="outline" size="lg" asChild className="h-12">
              <a href={`/prescription/${rx.id}?print=1`} target="_blank" rel="noreferrer">
                <PrinterIcon /> Print
              </a>
            </Button>
          )}
          <Button size="lg" onClick={() => void k.reset()} className="h-12 px-6">
            Done ({k.countdown}s)
          </Button>
        </div>
      </div>
      {rx && <PrescriptionView rx={rx} />}
    </div>
  );
}
