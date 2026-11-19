"use client";

import { useActionState } from "react";
import { ArrowRight, Loader2, Mail, MailCheck } from "lucide-react";
import { sendMagicLink, type MagicLinkState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: MagicLinkState = { status: "idle" };

export function MagicLinkForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  if (state.status === "sent") {
    return (
      <div className="flex gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm" role="status">
        <MailCheck className="mt-0.5 size-5 shrink-0 text-emerald-500" aria-hidden />
        <div>
          <p className="font-medium text-foreground">Check your inbox</p>
          <p className="mt-0.5 text-muted-foreground">{state.message}</p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            className="h-12 rounded-xl pl-10 text-[15px]"
            aria-invalid={state.status === "error" || undefined}
          />
        </div>
        {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
      </div>
      <Button type="submit" className="group h-12 w-full rounded-xl text-[15px]" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {pending ? "Sending link…" : "Email me a sign-in link"}
        {!pending && <ArrowRight className="transition-transform group-hover:translate-x-0.5" aria-hidden />}
      </Button>
    </form>
  );
}
