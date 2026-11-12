import { CheckCircle2, FileSearch, ShieldCheck, UserCheck } from "lucide-react";
import { VerdictBadge } from "@/components/verdict-badge";

/** A static mock-up of a result card, so visitors see what they will get. */
export function HeroPreview() {
  return (
    <div className="relative" aria-hidden>
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/10 blur-2xl" />
      <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Forwarded message</span>
          <VerdictBadge verdict="FALSE" />
        </div>
        <p className="rounded-lg bg-muted p-3 text-sm">
          “All polling stations will close at 2 PM this year. Go early or you will not be allowed to vote.”
        </p>
        <ul className="space-y-2.5 text-sm">
          <li className="flex gap-2">
            <FileSearch className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <span className="font-medium">Official schedule:</span> polls open 8 AM – 5 PM
            </span>
          </li>
          <li className="flex gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <span className="font-medium">Fact-check found:</span> rated False by an independent checker
            </span>
          </li>
          <li className="flex gap-2">
            <UserCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <span className="font-medium">Reviewed by a human</span> before publishing
            </span>
          </li>
        </ul>
        <div className="flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-emerald-600" />3 sources checked · published in 6 hours
        </div>
      </div>
    </div>
  );
}
