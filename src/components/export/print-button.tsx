"use client";

import { PrinterIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Opens the printable prescription page (browser print dialog → printer or "Save as PDF"). */
export function PrintPrescriptionButton({
  prescriptionId,
  label = "Print / PDF",
  variant = "outline",
}: {
  prescriptionId: string;
  label?: string;
  variant?: "outline" | "default" | "ghost";
}) {
  return (
    <Button variant={variant} asChild>
      <a href={`/prescription/${prescriptionId}?print=1`} target="_blank" rel="noreferrer">
        <PrinterIcon /> {label}
      </a>
    </Button>
  );
}
