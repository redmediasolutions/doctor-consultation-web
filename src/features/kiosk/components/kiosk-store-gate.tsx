"use client";

import { useState } from "react";
import { Loader2Icon, StoreIcon } from "lucide-react";

import { Logo } from "@/components/layout/brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchStores } from "@/features/admin/repository/directory-repository";
import type { SessionUser } from "@/features/auth/types";
import { usePoll } from "@/hooks/use-poll";
import { KioskScreen } from "./kiosk-screen";

const KEY = "mc.kiosk.store";

function readSaved() {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

/** Owner opening the kiosk: pick the store once (remembered in this browser). */
export function KioskStoreGate({ user }: { user: SessionUser }) {
  const stores = usePoll(fetchStores, 5 * 60_000);
  const [chosen, setChosen] = useState<string>(readSaved);
  const store = stores.data?.find((s) => s.id === chosen);

  const choose = (id: string) => {
    setChosen(id);
    try {
      if (id) localStorage.setItem(KEY, id);
      else localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
  };

  if (store) return <KioskScreen key={store.id} store={store} user={user} onChangeStore={() => choose("")} />;

  return (
    <main className="bg-grid flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="gap-4">
          <Logo href="/admin" sub="Store kiosk" />
          <div className="space-y-1.5">
            <CardTitle className="text-xl">Which store is this kiosk in?</CardTitle>
            <CardDescription>
              Consultations from this screen go to that store&apos;s pharmacy counter. Store staff logins skip this step.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2">
          {!stores.data ? (
            <div className="flex justify-center py-8 text-muted-foreground">
              {stores.error ? stores.error.message : <Loader2Icon className="size-6 animate-spin" />}
            </div>
          ) : (
            stores.data.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => choose(s.id)}
                className="flex items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:border-primary/50 hover:bg-secondary"
              >
                <StoreIcon className="size-5 text-primary" />
                <span>
                  <span className="block font-medium">{s.name}</span>
                  <span className="text-sm text-muted-foreground">{[s.address, s.city].filter(Boolean).join(", ")}</span>
                </span>
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  );
}
