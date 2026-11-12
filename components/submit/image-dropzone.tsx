"use client";

import { useEffect, useRef, useState } from "react";
import { ImageUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_MB = 5;

/** File picker with drag-and-drop and a preview of the chosen image. */
export function ImageDropzone({ invalid }: { invalid?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ url: string; name: string; size: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Free the preview's memory when it changes or the component unmounts.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);

  function showFile(file: File | undefined) {
    setError(null);
    if (!file) return setPreview(null);
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`This image is larger than ${MAX_MB} MB.`);
      if (inputRef.current) inputRef.current.value = "";
      return setPreview(null);
    }
    setPreview({ url: URL.createObjectURL(file), name: file.name, size: file.size });
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    setPreview(null);
  }

  return (
    <div>
      <label
        htmlFor="image"
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files[0];
          if (file && inputRef.current) {
            inputRef.current.files = event.dataTransfer.files;
            showFile(file);
          }
        }}
        className={cn(
          "flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition",
          dragging ? "border-primary bg-primary/5" : "hover:border-foreground/30 hover:bg-muted/40",
          (invalid || error) && "border-destructive/60",
          preview && "hidden",
        )}
      >
        <ImageUp className="size-8 text-muted-foreground" aria-hidden />
        <span className="font-medium">Drop an image here or click to choose</span>
        <span className="text-sm text-muted-foreground">JPG, PNG or WebP, up to {MAX_MB} MB</span>
      </label>
      <input
        ref={inputRef}
        id="image"
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => showFile(event.target.files?.[0])}
        required
      />

      {preview && (
        <div className="relative overflow-hidden rounded-xl border bg-muted/40">
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a file that isn't uploaded yet */}
          <img src={preview.url} alt="Preview of the chosen image" className="mx-auto max-h-72 object-contain" />
          <div className="flex items-center justify-between gap-3 border-t bg-background px-3 py-2 text-sm">
            <span className="truncate">
              {preview.name} <span className="text-muted-foreground">· {(preview.size / 1024 / 1024).toFixed(1)} MB</span>
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              <X aria-hidden /> Remove
            </Button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
