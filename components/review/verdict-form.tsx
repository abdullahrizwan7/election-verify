"use client";

import { useActionState } from "react";
import { Loader2, Megaphone } from "lucide-react";
import { publishReviewAction, type ReviewState } from "@/app/review/[id]/actions";
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
  const errors = state.errors ?? {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{current ? "Update the verdict" : "Your verdict"}</CardTitle>
        <CardDescription>
          {disabled ? "You can decide once the evidence is ready." : "This is what the public will see."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="submissionId" value={submissionId} />

          <fieldset disabled={disabled || pending} className="space-y-5">
            <RadioGroup name="verdict" defaultValue={current ?? suggested ?? undefined} className="grid grid-cols-2 gap-2">
              {VERDICT_ORDER.map((verdict) => (
                <Label
                  key={verdict}
                  htmlFor={`verdict-${verdict}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm font-normal transition hover:bg-muted/50",
                    "has-[[aria-checked=true]]:border-primary has-[[aria-checked=true]]:bg-primary/5",
                  )}
                >
                  <RadioGroupItem id={`verdict-${verdict}`} value={verdict} />
                  <span className={cn("size-2 rounded-full", VERDICTS[verdict].dotClassName)} aria-hidden />
                  {VERDICTS[verdict].label}
                  {verdict === suggested && <span className="ml-auto text-[10px] text-muted-foreground uppercase">AI</span>}
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
