"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hand, Loader2, Undo2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { moveClaimAction } from "@/app/review/board-actions";
import { Button } from "@/components/ui/button";

/** Shows who is reviewing a claim, with Take / Release buttons (same as dragging on the board). */
export function ClaimAssignment({ id, assigneeId, assigneeName, userId, isAdmin }: { id: string; assigneeId: string | null; assigneeName: string | null; userId: string; isAdmin: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const mine = assigneeId === userId;

  function go(to: "mine" | "open") {
    start(async () => {
      const result = await moveClaimAction(id, to);
      if (!result.ok) toast.error(result.error);
      else toast.success(to === "mine" ? "You’re reviewing this claim." : "Claim is back in the queue.");
      router.refresh();
    });
  }

  return (
    <div className="glass flex flex-wrap items-center gap-2 rounded-full bg-card py-1 pr-1 pl-3.5 ring-1 ring-foreground/[0.07]">
      <UserCheck className="size-4 text-muted-foreground" aria-hidden />
      <span className="text-sm font-semibold">{assigneeId ? (mine ? "You’re reviewing this" : `${assigneeName ?? "A reviewer"} is reviewing this`) : "Nobody has taken this yet"}</span>
      {!assigneeId && (
        <Button size="sm" className="h-8 rounded-full px-3.5" disabled={pending} onClick={() => go("mine")}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Hand aria-hidden />} Take it
        </Button>
      )}
      {assigneeId && (mine || isAdmin) && (
        <Button size="sm" variant="outline" className="h-8 rounded-full px-3.5" disabled={pending} onClick={() => go("open")}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Undo2 aria-hidden />} Release
        </Button>
      )}
    </div>
  );
}
