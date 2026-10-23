"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorMessage } from "@/lib/api";
import { SPECIALTIES } from "@/lib/config";
import { addDoctor } from "../repository/directory-repository";

/** Owner adds a doctor to the panel. */
export function AddDoctorForm({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: "",
    specialty: "General Physician",
    qualification: "",
    registrationNo: "",
    experienceYears: "",
    languages: "English, Kannada",
    fee: "200",
    phone: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await addDoctor(f);
      toast.success("Doctor added — they can now sign in with this mobile number");
      setF((prev) => ({ ...prev, name: "", registrationNo: "", qualification: "", experienceYears: "", phone: "" }));
      setOpen(false);
      onAdded();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon /> Add doctor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add doctor</DialogTitle>
          <DialogDescription>Only add doctors with a valid State Medical Council / NMC registration.</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label="Full name">
              <Input value={f.name} onChange={set("name")} placeholder="Dr. Priya Nayak" required />
            </FormField>
          </div>
          <FormField label="Specialty">
            <Select value={f.specialty} onValueChange={(v) => setF({ ...f, specialty: v })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPECIALTIES.map((sp) => (
                  <SelectItem key={sp} value={sp}>
                    {sp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Registration no.">
            <Input value={f.registrationNo} onChange={set("registrationNo")} placeholder="KMC 12345" required />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Qualification">
              <Input value={f.qualification} onChange={set("qualification")} placeholder="MBBS, MD" />
            </FormField>
          </div>
          <FormField label="Experience (years)">
            <Input value={f.experienceYears} onChange={set("experienceYears")} inputMode="numeric" />
          </FormField>
          <FormField label="Fee (₹)">
            <Input value={f.fee} onChange={set("fee")} inputMode="numeric" />
          </FormField>
          <FormField label="Languages (comma separated)">
            <Input value={f.languages} onChange={set("languages")} />
          </FormField>
          <FormField label="Mobile number (login)" hint="The doctor signs in with an OTP to this number">
            <Input value={f.phone} onChange={set("phone")} type="tel" inputMode="tel" placeholder="98450 12345" required />
          </FormField>
          <DialogFooter className="sm:col-span-2">
            <Button type="submit">Save doctor</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
