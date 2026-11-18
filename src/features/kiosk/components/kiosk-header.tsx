"use client";

import Link from "next/link";
import { ExpandIcon, LayoutDashboardIcon, LogOutIcon, PillIcon, ShrinkIcon, StoreIcon, UserCogIcon } from "lucide-react";

import { Logo } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PublicStore } from "@/features/admin/types";
import type { SessionUser } from "@/features/auth/types";
import { cn } from "@/lib/utils";

/** Kiosk top bar. Staff actions live in a small menu so patients don't wander off. */
export function KioskHeader({
  store,
  user,
  onlineCount,
  fullscreen,
  onToggleFullscreen,
  onSignOut,
  onChangeStore,
}: {
  store: PublicStore;
  user: SessionUser;
  onlineCount: number;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onSignOut: () => void;
  onChangeStore?: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Logo href={null} sub={store.name} />
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border px-3 py-1 text-sm sm:flex">
            <span className={cn("size-2 rounded-full", onlineCount > 0 ? "bg-success" : "bg-muted-foreground/40")} />
            {onlineCount} doctor{onlineCount === 1 ? "" : "s"} online
          </span>
          <Button variant="ghost" size="icon" onClick={onToggleFullscreen} aria-label={fullscreen ? "Exit full screen" : "Full screen"}>
            {fullscreen ? <ShrinkIcon /> : <ExpandIcon />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Staff menu">
                <UserCogIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="truncate">{user.fullName || "Store staff"}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">Store kiosk · {store.name}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/pharmacy">
                  <PillIcon /> Pharmacy counter
                </Link>
              </DropdownMenuItem>
              {user.kind === "admin" && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <LayoutDashboardIcon /> Owner dashboard
                  </Link>
                </DropdownMenuItem>
              )}
              {onChangeStore && (
                <DropdownMenuItem onSelect={onChangeStore}>
                  <StoreIcon /> Change store
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onSignOut} variant="destructive">
                <LogOutIcon /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
