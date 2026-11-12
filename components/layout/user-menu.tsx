"use client";

import Link from "next/link";
import { ClipboardCheck, Database, LogOut, Send } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLES } from "@/lib/labels";
import type { AppUser } from "@/lib/types";

export function UserMenu({ user, isAdmin }: { user: AppUser; isAdmin: boolean }) {
  const initials = (user.name ?? user.email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  const isReviewer = user.role !== "USER";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="font-medium">{user.name ?? user.email}</p>
          <p className="text-xs text-muted-foreground">
            {user.email} · {ROLES[user.role]}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/submit">
              <Send aria-hidden /> Submit a claim
            </Link>
          </DropdownMenuItem>
          {isReviewer && (
            <DropdownMenuItem asChild>
              <Link href="/review">
                <ClipboardCheck aria-hidden /> Review queue
              </Link>
            </DropdownMenuItem>
          )}
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/admin/sources">
                <Database aria-hidden /> Trusted sources
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut aria-hidden /> Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
