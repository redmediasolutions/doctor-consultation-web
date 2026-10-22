"use client";

import { useEffect, useState } from "react";
import { Loader2Icon, LockKeyholeIcon } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchDoctors, fetchStores } from "@/features/admin/repository/directory-repository";
import { login } from "@/features/auth/repository/auth-repository";
import type { Role } from "@/features/auth/types";
import { shortStore } from "@/lib/utils";

interface Option {
  id: string;
  label: string;
  sub: string;
}

const DEMO_PIN: Record<Role, string> = { doctor: "1234", staff: "1111", admin: "0000" };

/** PIN sign-in. Doctors pick their name, pharmacy counters pick their store, the owner only needs a PIN. */
export function PinLoginForm({ role, onSuccess }: { role: Role; onSuccess: () => void }) {
  const [options, setOptions] = useState<Option[]>([]);
  const [id, setId] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const needsSelection = role !== "admin";

  useEffect(() => {
    if (role === "doctor") {
      fetchDoctors()
        .then((d) => setOptions(d.map((x) => ({ id: x.id, label: x.name, sub: x.specialty }))))
        .catch((e) => toast.error((e as Error).message));
    } else if (role === "staff") {
      fetchStores()
        .then((s) => setOptions(s.map((x) => ({ id: x.id, label: shortStore(x.name), sub: x.city }))))
        .catch((e) => toast.error((e as Error).message));
    }
  }, [role]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(role, pin, needsSelection ? id : undefined);
      onSuccess();
    } catch (err) {
      toast.error((err as Error).message);
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {needsSelection && (
        <FormField label={role === "doctor" ? "Doctor" : "Store"}>
          <Select value={id} onValueChange={setId}>
            <SelectTrigger className="w-full" size="lg" aria-label={role === "doctor" ? "Doctor" : "Store"}>
              <SelectValue placeholder={role === "doctor" ? "Select your name" : "Select your store"} />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                  <span className="text-muted-foreground">· {o.sub}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}
      <FormField label="PIN" htmlFor="pin">
        <div className="relative">
          <LockKeyholeIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
            className="h-12 pl-9 text-lg tracking-[0.4em]"
            placeholder="••••"
          />
        </div>
      </FormField>
      <Button type="submit" size="lg" className="w-full" disabled={busy || !pin || (needsSelection && !id)}>
        {busy && <Loader2Icon className="animate-spin" />}
        Sign in
      </Button>
      <p className="text-center text-xs text-muted-foreground">Demo PIN: {DEMO_PIN[role]}</p>
    </form>
  );
}
