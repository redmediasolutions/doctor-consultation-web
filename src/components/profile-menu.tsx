"use client";

import { LogOutIcon, RefreshCwIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/utils";

/** Avatar menu in the header: who is signed in, refresh and sign out. */
export function ProfileMenu({
  name,
  subtitle,
  onSignOut,
  onRefresh,
}: {
  name: string;
  subtitle?: string;
  onSignOut: () => void;
  onRefresh?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 px-2" aria-label="Account menu">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/15 text-xs text-primary">{initials(name)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-left leading-tight md:block">
            <span className="block text-sm font-medium">{name}</span>
            {subtitle && <span className="block text-xs font-normal text-muted-foreground">{subtitle}</span>}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block">{name}</span>
          {subtitle && <span className="block text-xs font-normal text-muted-foreground">{subtitle}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {onRefresh && (
          <DropdownMenuItem onSelect={onRefresh}>
            <RefreshCwIcon /> Refresh
          </DropdownMenuItem>
        )}
        <DropdownMenuItem variant="destructive" onSelect={onSignOut}>
          <LogOutIcon /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
