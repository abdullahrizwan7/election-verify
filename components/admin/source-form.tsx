"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { saveSourceAction, type SourceState } from "@/app/admin/sources/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SOURCE_TYPES } from "@/lib/labels";
import type { SourceType } from "@/lib/types";

const initialState: SourceState = {};

export function SourceForm() {
  const [state, formAction, pending] = useActionState(saveSourceAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.errors ?? {};

  useEffect(() => {
    if (state.saved) {
      toast.success(`Saved ${state.saved}`);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="domain">Domain</Label>
        <Input id="domain" name="domain" placeholder="example-news.com" required aria-invalid={Boolean(errors.domain)} />
        {errors.domain && <p className="text-sm text-destructive">{errors.domain}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" placeholder="Example News" required aria-invalid={Boolean(errors.name)} />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <Select name="type" defaultValue="NEWS">
            <SelectTrigger id="type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SOURCE_TYPES) as SourceType[]).map((type) => (
                <SelectItem key={type} value={type}>
                  {SOURCE_TYPES[type].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="trust">Trust (0–100)</Label>
          <Input id="trust" name="trust" type="number" min={0} max={100} defaultValue={70} required />
          {errors.trust && <p className="text-sm text-destructive">{errors.trust}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">
          Notes <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input id="notes" name="notes" placeholder="Why this rating?" />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
        Save source
      </Button>
    </form>
  );
}
