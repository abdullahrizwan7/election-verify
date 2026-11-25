"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Megaphone } from "lucide-react";
import { publishReviewAction, type ReviewState } from "@/app/review/[id]/actions";
import { isTyping } from "@/components/command-palette";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { VERDICT_ORDER, VERDICTS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Verdict } from "@/lib/types";

const initialState: ReviewState = {};

export function VerdictForm({
  submissionId,
  suggested,
  current,
  currentNote,
  disabled,
}: {
  submissionId: string;
  suggested: Verdict | null;
  current: Verdict | null;
  currentNote: string | null;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(publishReviewAction, initialState);
  const [verdict, setVerdict] = useState<string>(current ?? suggested ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.errors ?? {};

  // Shortcuts: 1–6 pick a verdict, Ctrl/⌘ + Enter publishes.
  useEffect(() => {
    if (disabled) return;
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        formRef.current?.requestSubmit();
        return;
      }
      const index = Number(event.key) - 1;
      if (!isTyping(event.target) && !event.metaKey && !event.ctrlKey && index >= 0 && index < VERDICT_ORDER.length) {
        setVerdict(VERDICT_ORDER[index]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled]);

  return (
    <Card id="verdict" data-tour="verdict-form" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="text-base">{current ? "Update the verdict" : "Your verdict"}</CardTitle>
        <CardDescription>
          {disabled ? "You can decide once the evidence is ready." : "This is what the public will see."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-5">
          <input type="hidden" name="submissionId" value={submissionId} />

          <fieldset disabled={disabled || pending} className="space-y-5">
            <RadioGroup name="verdict" value={verdict} onValueChange={setVerdict} className="grid grid-cols-2 gap-2">
              {VERDICT_ORDER.map((option, index) => (
                <Label
                  key={option}
                  htmlFor={`verdict-${option}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm font-normal transition hover:bg-muted/50",
                    "has-[[aria-checked=true]]:border-primary has-[[aria-checked=true]]:bg-primary/5",
                  )}
                >
                  <RadioGroupItem id={`verdict-${option}`} value={option} />
                  <span className={cn("size-2 rounded-full", VERDICTS[option].dotClassName)} aria-hidden />
                  {VERDICTS[option].label}
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground uppercase">
                    {option === suggested && "AI"}
                    <kbd className="rounded border px-1 font-mono">{index + 1}</kbd>
                  </span>
                </Label>
              ))}
            </RadioGroup>
            {errors.verdict && <p className="text-sm text-destructive">{errors.verdict}</p>}

            <div className="space-y-1.5">
              <Label htmlFor="publicNote">Public explanation</Label>
              <Textarea
                id="publicNote"
                name="publicNote"
                rows={4}
                placeholder="In plain words: what is true, what is not, and which sources show it."
                defaultValue={currentNote ?? undefined}
                aria-invalid={Boolean(errors.publicNote)}
                required
                minLength={20}
              />
              {errors.publicNote && <p className="text-sm text-destructive">{errors.publicNote}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="internalNote">
                Note for other reviewers <span className="font-normal text-muted-foreground">(private)</span>
              </Label>
              <Textarea id="internalNote" name="internalNote" rows={2} placeholder="Anything you checked by hand." />
            </div>

            {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

            <p className="text-xs text-muted-foreground">
              Shortcut: <kbd className="rounded border bg-muted px-1 font-mono">Ctrl/⌘ + Enter</kbd> publishes.
            </p>
            <Button type="submit" className="h-9 w-full">
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Megaphone aria-hidden />}
              {current ? "Update published verdict" : "Publish verdict"}
            </Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}
