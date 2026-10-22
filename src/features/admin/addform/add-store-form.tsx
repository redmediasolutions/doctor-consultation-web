"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { addStore } from "../repository/directory-repository";

/** Owner adds a store (then sets up its tablet in the app's Store kiosk mode). */
export function AddStoreForm({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", address: "", city: "", phone: "", pharmacistName: "", drugLicenseNo: "", staffPin: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await addStore(f);
      toast.success("Store added");
      setOpen(false);
      onAdded();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon /> Add store
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add store</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label="Store name">
              <Input value={f.name} onChange={set("name")} required />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label="Address">
              <Input value={f.address} onChange={set("address")} />
            </FormField>
          </div>
          <FormField label="City">
            <Input value={f.city} onChange={set("city")} />
          </FormField>
          <FormField label="Phone">
            <Input value={f.phone} onChange={set("phone")} />
          </FormField>
          <FormField label="Pharmacist">
            <Input value={f.pharmacistName} onChange={set("pharmacistName")} />
          </FormField>
          <FormField label="Drug licence no.">
            <Input value={f.drugLicenseNo} onChange={set("drugLicenseNo")} />
          </FormField>
          <FormField label="Counter staff PIN">
            <Input value={f.staffPin} onChange={set("staffPin")} inputMode="numeric" required />
          </FormField>
          <DialogFooter className="sm:col-span-2">
            <Button type="submit">Save store</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
