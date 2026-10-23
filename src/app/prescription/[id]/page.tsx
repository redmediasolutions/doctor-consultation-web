"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2Icon } from "lucide-react";

import { RoleGuard } from "@/features/auth/components/role-guard";
import { PrescriptionView } from "@/features/prescriptions/components/prescription-view";
import { getPrescription } from "@/features/prescriptions/repository/prescription-repository";
import type { PrescriptionWithRefs } from "@/features/prescriptions/types";
import { errorMessage } from "@/lib/api";
import { PrintBar } from "./print-bar";

/** Printable A4 prescription (signed-in doctor, store staff or owner). */
export default function PrescriptionPage() {
  return <RoleGuard kinds={["doctor", "staff", "admin"]}>{() => <PrescriptionLoader />}</RoleGuard>;
}

function PrescriptionLoader() {
  const { id } = useParams<{ id: string }>();
  const autoPrint = useSearchParams().get("print") === "1";
  const [rx, setRx] = useState<PrescriptionWithRefs | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPrescription(id).then(setRx, (e) => setError(errorMessage(e)));
  }, [id]);

  return (
    <main className="min-h-screen bg-muted/40 py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl space-y-4 px-4 print:max-w-none print:px-0">
        {rx ? (
          <>
            <PrintBar autoPrint={autoPrint} />
            <PrescriptionView rx={rx} className="shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none" />
          </>
        ) : (
          <div className="flex justify-center py-24 text-muted-foreground">
            {error ?? <Loader2Icon className="size-6 animate-spin" />}
          </div>
        )}
      </div>
    </main>
  );
}
