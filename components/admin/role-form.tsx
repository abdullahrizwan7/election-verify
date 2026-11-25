"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";
import { setRoleAction, type RoleState } from "@/app/admin/users/actions";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/lib/labels";
import type { Role } from "@/lib/types";

/** A role picker and save button for one person. */
export function RoleForm({ userId, role, isSelf }: { userId: string; role: Role; isSelf: boolean }) {
  const [state, action, pending] = useActionState<RoleState, FormData>(setRoleAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        defaultValue={role}
        disabled={isSelf}
        aria-label="Role"
        className="h-9 rounded-full border border-transparent bg-foreground/[0.06] px-3 text-sm font-semibold outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:opacity-60"
      >
        {(Object.keys(ROLES) as Role[]).map((value) => (
          <option key={value} value={value}>
            {ROLES[value]}
          </option>
        ))}
      </select>
      {!isSelf && (
        <Button type="submit" size="sm" variant="outline" disabled={pending} className="h-9 rounded-full px-4">
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : null} Save
        </Button>
      )}
      {state.saved && !pending && (
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300" role="status">
          <Check className="size-3.5" aria-hidden /> Saved
        </span>
      )}
      {state.error && <span className="text-xs text-destructive">{state.error}</span>}
      {isSelf && <span className="text-xs text-muted-foreground">That&rsquo;s you</span>}
    </form>
  );
}
