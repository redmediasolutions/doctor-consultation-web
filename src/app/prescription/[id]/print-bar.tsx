"use client";

import { useEffect } from "react";
import { PrinterIcon } from "lucide-react";

import { Logo } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";

export function PrintBar({ autoPrint }: { autoPrint?: boolean }) {
  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  return (
    <div className="no-print flex items-center justify-between">
      <Logo href={null} sub="e-Prescription" />
      <Button onClick={() => window.print()}>
        <PrinterIcon /> Print / Save PDF
      </Button>
    </div>
  );
}
