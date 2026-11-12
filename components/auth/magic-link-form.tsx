"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { sendMagicLink, type MagicLinkState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: MagicLinkState = { status: "idle" };

export function MagicLinkForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  if (state.status === "sent") {
    return (
      <p className="flex gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Email me a sign-in link
      </Button>
    </form>
  );
}
