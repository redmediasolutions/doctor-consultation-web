import Link from "next/link";
import {
  ArrowRightIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  PillIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  StethoscopeIcon,
  VideoIcon,
} from "lucide-react";

import { Logo } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND } from "@/lib/config";

const consoles = [
  {
    href: "/login",
    icon: StethoscopeIcon,
    title: "Doctor console",
    desc: "Live queue from all stores, Agora video consultation with patient vitals, and e-prescriptions.",
    who: "Doctors",
  },
  {
    href: "/login",
    icon: PillIcon,
    title: "Pharmacy counter",
    desc: "Prescriptions arrive at the counter instantly. Print, dispense and mark as handed over.",
    who: "Store staff",
  },
  {
    href: "/login",
    icon: LayoutDashboardIcon,
    title: "Owner dashboard",
    desc: "Today's consultations across all stores, doctor availability, wait times, fees, doctors and stores.",
    who: "Owner",
  },
];

export default function Home() {
  return (
    <main className="bg-grid flex-1">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <header className="flex items-center justify-between gap-3">
          <Logo href={null} sub={BRAND.chain} />
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              <ShieldCheckIcon /> Telemedicine Practice Guidelines aligned
            </Badge>
            <ThemeToggle />
          </div>
        </header>

        <section className="mt-12 max-w-3xl md:mt-16">
          <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            A doctor in every store, <span className="text-primary">one tap away.</span>
          </h1>
          <p className="mt-4 text-lg text-pretty text-muted-foreground">
            Walk-in patients consult a qualified doctor over video from the store tablet. The e-prescription lands at the
            pharmacy counter the moment the call ends.
          </p>
          <div className="mt-6 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <VideoIcon className="size-4 text-primary" /> HD video by Agora
            </span>
            <span className="flex items-center gap-2">
              <FileTextIcon className="size-4 text-primary" /> Digital prescriptions
            </span>
            <span className="flex items-center gap-2">
              <SmartphoneIcon className="size-4 text-primary" /> Kiosk & doctor app (Flutter)
            </span>
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {consoles.map((c) => (
            <Link key={c.href} href={c.href} className="group">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                      <c.icon className="size-5" />
                    </span>
                    <Badge variant="outline">{c.who}</Badge>
                  </div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {c.title}
                    <ArrowRightIcon className="size-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </CardTitle>
                  <CardDescription className="text-pretty">{c.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </section>

        <p className="mt-10 text-sm text-muted-foreground">
          Patients use the <strong className="text-foreground">MedConnect app</strong> on the store tablet (kiosk mode). Doctors
          can consult from this website or from the same app on their phone.
        </p>
      </div>
    </main>
  );
}
