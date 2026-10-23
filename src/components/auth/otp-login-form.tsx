"use client";

import { useState } from "react";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SessionUser } from "@/features/auth/types";
import { useAuth } from "@/hooks/use-auth";
import { errorMessage } from "@/lib/api";

/** Mobile number → OTP (MSG91 via the Gladskin cloud function) → signed in. */
export function OtpLoginForm({ onSuccess }: { onSuccess: (user: SessionUser) => void }) {
  const { sendOtp, verifyOtp } = useAuth();
  const [phone, setPhone] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [otp, setOtp] = useState("");
  const [reqId, setReqId] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await sendOtp({ phoneNumber: phone });
      setReqId(res.reqId);
      setSentTo(res.phoneNumber);
      setOtp("");
      setStep("otp");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      onSuccess(await verifyOtp({ phoneNumber: sentTo, otp, reqId }));
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  }

  const errorBox = error ? (
    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
      {error}
    </p>
  ) : null;

  if (step === "phone") {
    return (
      <form onSubmit={handleSend} className="grid gap-4">
        <FormField label="Mobile number" htmlFor="phone">
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98765 43210"
            autoFocus
            disabled={pending}
            className="h-11 text-base"
          />
        </FormField>
        {errorBox}
        <Button type="submit" size="lg" disabled={pending || phone.replace(/\D/g, "").length < 10}>
          {pending && <Loader2Icon className="animate-spin" />}
          Send OTP
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerify} className="grid gap-4">
      <button
        type="button"
        onClick={() => {
          setStep("phone");
          setError(null);
        }}
        disabled={pending}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        <ArrowLeftIcon className="size-4" /> Change number
      </button>
      <p className="text-sm text-muted-foreground">
        Enter the code sent to <span className="font-medium text-foreground">{sentTo}</span>
      </p>
      <FormField label="OTP" htmlFor="otp">
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          placeholder="••••••"
          autoFocus
          disabled={pending}
          className="h-11 text-center text-lg tracking-[0.35em]"
        />
      </FormField>
      {errorBox}
      <Button type="submit" size="lg" disabled={pending || otp.length < 4}>
        {pending && <Loader2Icon className="animate-spin" />}
        Verify & sign in
      </Button>
    </form>
  );
}
