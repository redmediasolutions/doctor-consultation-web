"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { authRepository } from "@/features/auth/repository/auth.repository";
import { authService } from "@/features/auth/services/auth.service";
import type { SendOtpInput, SessionUser, VerifyOtpInput } from "@/features/auth/types";
import { ApiError } from "@/lib/api";
import { authLog } from "@/lib/auth-logger";
import { getFreshToken, SESSION_EXPIRED_EVENT } from "@/lib/session";

type AuthStatus = "loading" | "authenticated" | "anonymous";

export type AuthContextValue = {
  user: SessionUser | null;
  status: AuthStatus;
  sendOtp: (input: SendOtpInput) => Promise<{ reqId: string; phoneNumber: string }>;
  verifyOtp: (input: VerifyOtpInput) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refresh = useCallback(async () => {
    const token = await getFreshToken();
    if (!token) {
      setUser(null);
      setStatus("anonymous");
      return;
    }
    try {
      setUser(await authRepository.me());
      setStatus("authenticated");
    } catch (error) {
      authLog.fail("SESSION", "Stored session rejected → logging out", error);
      // 403 = signed in to Firebase but not allowed (not registered / deactivated).
      if (error instanceof ApiError && error.status === 403) toast.error(error.message);
      // Server unreachable: keep the Firebase login, just show the error.
      if (error instanceof ApiError && error.status === 0) {
        toast.error(error.message);
        setStatus("anonymous");
        return;
      }
      await authService.logout();
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  const handleExpired = useCallback(() => {
    if (status !== "authenticated") return;
    toast.error("Your login has expired. Please log in again.");
    void authService.logout();
    setUser(null);
    setStatus("anonymous");
  }, [status]);

  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, [handleExpired]);

  const sendOtp = useCallback((input: SendOtpInput) => authService.sendOtp(input), []);

  const verifyOtp = useCallback(async (input: VerifyOtpInput) => {
    const result = await authService.verifyOtp(input);
    setUser(result);
    setStatus("authenticated");
    return result;
  }, []);

  const logout = useCallback(async () => {
    if (user?.kind === "doctor") await authRepository.goOffline();
    await authService.logout();
    setUser(null);
    setStatus("anonymous");
  }, [user]);

  const value = useMemo(
    () => ({ user, status, sendOtp, verifyOtp, logout, refresh }),
    [user, status, sendOtp, verifyOtp, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
