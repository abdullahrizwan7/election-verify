"use client";

import { useState } from "react";
import { Eye, EyeOff, ScanEye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Evidence } from "@/lib/types";

/**
 * Image forensics for reviewers and the public:
 * - the words found in the image, outlined right on the picture
 * - a slider comparing the picture with an earlier copy, if we found one
 * - a "terminal" panel with the photo's metadata and the AI's observations
 */
export function ForensicsViewer({ imageUrl, evidence }: { imageUrl: string; evidence: Evidence[] }) {
  const ocr = evidence.find((e) => e.kind === "OCR_TEXT" && e.data?.words?.length);
  const metadata = evidence.find((e) => e.kind === "IMAGE_METADATA");
  const notes = evidence.find((e) => e.kind === "AI_IMAGE_NOTES");
  const earlier = evidence.find((e) => e.kind === "IMAGE_MATCH" && e.data?.compareImageUrl);
  const matches = evidence.filter((e) => e.kind === "IMAGE_MATCH").length;

  const [showBoxes, setShowBoxes] = useState(true);
  const [split, setSplit] = useState(50);

  const words = ocr?.data?.words ?? [];
  const width = ocr?.data?.imageWidth;
  const height = ocr?.data?.imageHeight;

  return (
    <Card data-tour="forensics">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ScanEye className="size-4 text-glow" aria-hidden /> Image forensics
        </CardTitle>
        <CardDescription>What the picture contains, where it came from, and whether it was seen before.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[1.5fr_1fr] [&>*]:min-w-0">
        <Tabs defaultValue="text">
          <TabsList>
            <TabsTrigger value="text">Text found ({words.length})</TabsTrigger>
            {earlier && <TabsTrigger value="compare">Compare with earlier copy</TabsTrigger>}
          </TabsList>

          <TabsContent value="text" className="mt-3 space-y-2">
            <div
              className="relative w-full overflow-hidden rounded-lg border bg-black/40"
              style={width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- stored uploads and data URLs */}
              <img src={imageUrl} alt="The submitted image" className={width && height ? "absolute inset-0 size-full object-fill" : "w-full"} />
              {width && height && showBoxes && (
                <>
                  {words.map((word, i) => {
                    const [x0, y0, x1, y1] = word.box;
                    return (
                      <span
                        key={i}
                        title={word.text}
                        className="group absolute rounded-sm border border-glow bg-glow/15 shadow-[0_0_12px_-2px] shadow-glow/80"
                        style={{
                          left: `${(x0 / width) * 100}%`,
                          top: `${(y0 / height) * 100}%`,
                          width: `${((x1 - x0) / width) * 100}%`,
                          height: `${((y1 - y0) / height) * 100}%`,
                        }}
                      >
                        <span className="absolute -top-5 left-0 hidden rounded bg-black/80 px-1 font-mono text-[10px] whitespace-nowrap text-glow group-hover:block">
                          {word.text}
                        </span>
                      </span>
                    );
                  })}
                  {/* A scanning line, like a document scanner */}
                  <span aria-hidden className="pointer-events-none absolute inset-x-0 h-10 animate-scan-y bg-gradient-to-b from-transparent via-glow/25 to-transparent" />
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{words.length ? "Hover a box to see the word." : "No readable text was found in this image."}</span>
              {words.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setShowBoxes((v) => !v)}>
                  {showBoxes ? <EyeOff aria-hidden /> : <Eye aria-hidden />} {showBoxes ? "Hide boxes" : "Show boxes"}
                </Button>
              )}
            </div>
          </TabsContent>

          {earlier && (
            <TabsContent value="compare" className="mt-3 space-y-2">
              <div className="relative w-full overflow-hidden rounded-lg border bg-black/40" style={{ aspectRatio: "16 / 10" }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- stored uploads and data URLs */}
                <img src={earlier.data!.compareImageUrl} alt="Earlier copy of the image" className="absolute inset-0 size-full object-contain" />
                <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- stored uploads and data URLs */}
                  <img src={imageUrl} alt="The submitted image" className="absolute inset-0 size-full object-contain" />
                </div>
                <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-glow shadow-[0_0_12px_2px] shadow-glow" style={{ left: `${split}%` }} />
                <span className="absolute top-2 left-2 rounded bg-black/70 px-2 py-0.5 text-[11px] text-white">Submitted</span>
                <span className="absolute top-2 right-2 rounded bg-black/70 px-2 py-0.5 text-[11px] text-white">{earlier.data!.compareLabel ?? "Earlier copy"}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={split}
                onChange={(e) => setSplit(Number(e.target.value))}
                aria-label="Slide to compare the submitted image with the earlier copy"
                className="w-full accent-[var(--glow)]"
              />
            </TabsContent>
          )}
        </Tabs>

        {/* Metadata, shown like a terminal readout */}
        <div className="relative overflow-hidden rounded-lg border border-glow/30 bg-black/50 p-4 font-mono text-xs text-slate-200 shadow-[inset_0_0_40px_-20px] shadow-glow/50">
          <span aria-hidden className="pointer-events-none absolute inset-x-0 h-8 animate-scan-y bg-gradient-to-b from-transparent via-glow/10 to-transparent" />
          <p className="mb-3 text-[10px] tracking-[0.2em] text-glow">
            ▍FORENSICS READOUT<span className="animate-pulse">_</span>
          </p>
          <dl className="space-y-1.5">
            {Object.entries(metadata?.data?.fields ?? { Metadata: "not analysed yet" }).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-3 border-b border-white/5 pb-1">
                <dt className="text-slate-400">{key}</dt>
                <dd className={value.includes("hidden") ? "text-amber-300" : "text-right"}>{value}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-3 border-b border-white/5 pb-1">
              <dt className="text-slate-400">Words read</dt>
              <dd>{words.length}</dd>
            </div>
            <div className="flex justify-between gap-3 pb-1">
              <dt className="text-slate-400">Earlier copies</dt>
              <dd className={matches ? "text-amber-300" : ""}>{matches || "none found"}</dd>
            </div>
          </dl>
          {notes?.snippet && (
            <div className="mt-4 rounded border border-white/10 p-2.5">
              <p className="mb-1 text-[10px] tracking-[0.2em] text-glow-2">AI OBSERVATIONS · NOT PROOF</p>
              <p className="font-sans leading-relaxed text-slate-300">{notes.snippet}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
