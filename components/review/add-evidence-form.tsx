"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { addEvidenceAction, type EvidenceState } from "@/app/review/[id]/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Claim } from "@/lib/types";

const initialState: EvidenceState = {};
const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

/** Lets a reviewer record evidence they found themselves, such as a call to the election office. */
export function AddEvidenceForm({ submissionId, claims }: { submissionId: string; claims: Claim[] }) {
  const [state, formAction, pending] = useActionState(addEvidenceAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.errors ?? {};

  useEffect(() => {
    if (state.saved) {
      toast.success("Evidence added");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="size-4 text-muted-foreground" aria-hidden /> Add evidence you found
        </CardTitle>
        <CardDescription>For example an official notice, a news report, or what an election office told you.</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="submissionId" value={submissionId} />

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="evidence-title">What is it?</Label>
            <Input id="evidence-title" name="title" placeholder="District office confirms ballots are stored safely" required minLength={5} />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="evidence-url">
              Link <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input id="evidence-url" name="url" type="url" placeholder="https://…" />
            {errors.url && <p className="text-sm text-destructive">{errors.url}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="evidence-stance">It…</Label>
            <select id="evidence-stance" name="stance" defaultValue="REFUTES" className={selectClass}>
              <option value="REFUTES">Contradicts the claim</option>
              <option value="SUPPORTS">Supports the claim</option>
              <option value="NEUTRAL">Is related but neutral</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="evidence-claim">About</Label>
            <select id="evidence-claim" name="claimId" defaultValue="" className={selectClass}>
              <option value="">The whole submission</option>
              {claims.map((claim, index) => (
                <option key={claim.id} value={claim.id}>
                  Claim {index + 1}: {claim.text.slice(0, 60)}
                  {claim.text.length > 60 ? "…" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="evidence-note">
              Details <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea id="evidence-note" name="note" rows={2} placeholder="What it says, and why it matters." />
          </div>

          {errors.form && <p className="text-sm text-destructive sm:col-span-2">{errors.form}</p>}

          <div className="sm:col-span-2">
            <Button type="submit" variant="outline" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
              Add evidence
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
