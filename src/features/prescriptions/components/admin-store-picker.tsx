"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchStores } from "@/features/admin/repository/directory-repository";
import type { PublicStore } from "@/features/admin/types";
import type { SessionUser } from "@/features/auth/types";
import { usePoll } from "@/hooks/use-poll";
import { PharmacyCounter } from "./pharmacy-counter";

const KEY = "mc.pharmacy.store";

/** Owner opens the pharmacy counter of any store. */
export function AdminStorePicker({ user }: { user: SessionUser }) {
  const stores = usePoll(fetchStores, 60_000);
  const [chosen, setStoreId] = useState<string>(() => {
    try {
      return localStorage.getItem(KEY) ?? "";
    } catch {
      return "";
    }
  });
  const storeId = stores.data?.some((s) => s.id === chosen) ? chosen : (stores.data?.[0]?.id ?? "");

  const store: PublicStore | undefined = stores.data?.find((s) => s.id === storeId);
  if (!store) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground">
        {stores.error ? stores.error.message : <Loader2Icon className="size-6 animate-spin" />}
      </div>
    );
  }

  const picker = (
    <Select
      value={store.id}
      onValueChange={(v) => {
        setStoreId(v);
        try {
          localStorage.setItem(KEY, v);
        } catch {
          /* storage unavailable */
        }
      }}
    >
      <SelectTrigger className="w-44" aria-label="Store">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(stores.data ?? []).map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return <PharmacyCounter key={store.id} store={store} user={user} storePicker={picker} />;
}
