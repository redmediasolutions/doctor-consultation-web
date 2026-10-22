import { notFound } from "next/navigation";

import { PrescriptionView } from "@/features/prescriptions/components/prescription-view";
import { getPrescription } from "@/features/prescriptions/services/prescription-service";
import { PrintBar } from "./print-bar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prescription" };

/** Printable A4 prescription. The id is unguessable; anyone with the link can view it. */
export default async function PrescriptionPage({ params, searchParams }: PageProps<"/prescription/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const rx = await getPrescription(id);
  if (!rx) notFound();

  return (
    <main className="min-h-screen bg-muted/40 py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl space-y-4 px-4 print:max-w-none print:px-0">
        <PrintBar autoPrint={sp.print === "1"} />
        <PrescriptionView rx={rx} className="shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none" />
      </div>
    </main>
  );
}
