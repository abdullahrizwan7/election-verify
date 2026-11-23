"use client";

import { useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, ImageIcon, Link2, Loader2, Send } from "lucide-react";
import { createSubmissionAction, type SubmitState } from "@/app/(public)/submit/actions";
import { ImageDropzone } from "@/components/submit/image-dropzone";
import { T } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { InputType } from "@/lib/types";

const initialState: SubmitState = {};
const TEXT_LIMIT = 5000;
/** A typical rumour, filled in by presenter mode (?prefill=demo). */
const DEMO_MESSAGE =
  "FORWARDED MANY TIMES: Election day has been moved to Sunday this year because of the holiday. Polling stations will be closed on Saturday. Share with everyone in your family!";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}

export function SubmitForm() {
  const [state, formAction, pending] = useActionState(createSubmissionAction, initialState);
  const prefill = useSearchParams().get("prefill") === "demo";
  const [type, setType] = useState<InputType>(prefill ? "TEXT" : "URL");
  const defaultText = state.values?.text ?? (prefill ? DEMO_MESSAGE : undefined);
  const [textLength, setTextLength] = useState(defaultText?.length ?? 0);
  const errors = state.errors ?? {};

  // If sending takes unusually long (a weak or upload-blocking connection), say so instead of spinning silently.
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setSlow(true), 20000);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [pending]);

  return (
    <form action={formAction} className="space-y-6">
      {/* Tells the server which tab was used */}
      <input type="hidden" name="type" value={type} />

      <Tabs value={type} onValueChange={(value) => setType(value as InputType)}>
        <TabsList className="grid h-12! w-full grid-cols-3">
          <TabsTrigger value="URL">
            <Link2 aria-hidden /> <T k="submit.link" />
          </TabsTrigger>
          <TabsTrigger value="TEXT">
            <FileText aria-hidden /> <T k="submit.text" />
          </TabsTrigger>
          <TabsTrigger value="IMAGE">
            <ImageIcon aria-hidden /> <T k="submit.image" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="URL" className="space-y-2 pt-4">
          <Label htmlFor="url">News article or web page link</Label>
          <Input
            id="url"
            name="url"
            type="url"
            inputMode="url"
            placeholder="https://news-site.com/article"
            defaultValue={state.values?.url}
            aria-invalid={Boolean(errors.url)}
            required
          />
          <FieldError message={errors.url} />
          <p className="text-sm text-muted-foreground">
            Social media posts often can’t be read automatically. For those, paste the text or upload a screenshot.
          </p>
        </TabsContent>

        <TabsContent value="TEXT" className="space-y-2 pt-4">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="text">Message or post text</Label>
            <span className="text-xs text-muted-foreground tabular-nums">
              {textLength.toLocaleString()} / {TEXT_LIMIT.toLocaleString()}
            </span>
          </div>
          <Textarea
            id="text"
            name="text"
            rows={7}
            maxLength={TEXT_LIMIT}
            minLength={20}
            placeholder="Paste the forwarded message or post exactly as you received it."
            defaultValue={defaultText}
            onChange={(event) => setTextLength(event.target.value.length)}
            aria-invalid={Boolean(errors.text)}
            required
          />
          <FieldError message={errors.text} />
        </TabsContent>

        <TabsContent value="IMAGE" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="image">Photo or screenshot</Label>
            <ImageDropzone invalid={Boolean(errors.image)} />
            <FieldError message={errors.image} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="caption">
              What did the message with this image say? <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="caption"
              name="caption"
              rows={3}
              maxLength={500}
              placeholder="e.g. “Huge crowd at yesterday's rally”"
              defaultValue={state.values?.caption}
            />
            <FieldError message={errors.caption} />
          </div>
        </TabsContent>
      </Tabs>

      <FieldError message={errors.form ?? errors.type} />
      {pending && slow && (
        <p className="rounded-2xl bg-tint-sky p-3 text-sm text-tint-sky-foreground" role="status">
          Still sending… your connection is slow or may be blocking uploads. You can wait, or try again on Wi-Fi. A screenshot
          uploads faster than a full photo.
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-foreground/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Don’t include personal details such as phone numbers or home addresses.
        </p>
        <Button type="submit" variant="brand" disabled={pending} className="h-12 px-6 text-[15px]">
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
          {pending ? "Sending…" : <T k="submit.button" />}
        </Button>
      </div>
    </form>
  );
}
