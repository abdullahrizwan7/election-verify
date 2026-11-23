"use client";

import { useEffect, useRef, useState } from "react";
import { ImageUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Largest photo people can pick. Bigger photos are shrunk before upload. */
const MAX_PICK_MB = 25;
/**
 * Photos above this are resized in the browser: the upload stays well under the
 * 4.5 MB hosting limit and goes through on slow or unreliable mobile connections.
 * Smaller files are sent untouched, so their photo details stay available for checks.
 */
const RESIZE_ABOVE_BYTES = 1.5 * 1024 * 1024;
const MAX_EDGE = 2048;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

/**
 * Re-encodes a photo as a smaller JPEG (longest side at most 2048 px), lowering the
 * quality step by step until it fits. Returns null if the browser can't read the image.
 */
async function shrinkImage(file: File): Promise<File | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    for (const quality of [0.82, 0.72, 0.62, 0.52]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && (blob.size <= RESIZE_ABOVE_BYTES || quality === 0.52)) {
        const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
        return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** File picker with drag-and-drop, a preview, and automatic resizing of large photos. */
export function ImageDropzone({ invalid }: { invalid?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ url: string; name: string; size: number; note?: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  // Free the preview's memory when it changes or the component unmounts.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);

  /** Puts the (possibly resized) file into the form field that gets submitted. */
  function putInForm(file: File) {
    const input = inputRef.current;
    if (input) {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
    }
  }

  async function showFile(file: File | undefined) {
    setError(null);
    if (!file) return setPreview(null);
    if (file.size > MAX_PICK_MB * 1024 * 1024) {
      setError(`This image is larger than ${MAX_PICK_MB} MB. Please choose a smaller one.`);
      if (inputRef.current) inputRef.current.value = "";
      return setPreview(null);
    }

    let chosen = file;
    let note: string | undefined;
    // Big photos, and formats the server doesn't take (like HEIC), become a smaller JPEG.
    if (file.size > RESIZE_ABOVE_BYTES || !ALLOWED.includes(file.type)) {
      setWorking(true);
      const smaller = await shrinkImage(file);
      setWorking(false);
      if (!smaller) {
        setError("We couldn't read this image. Please use a JPG, PNG or WebP photo or screenshot.");
        if (inputRef.current) inputRef.current.value = "";
        return setPreview(null);
      }
      chosen = smaller;
      putInForm(smaller);
      note = `Resized from ${formatSize(file.size)} so it uploads quickly.`;
    }
    setPreview({ url: URL.createObjectURL(chosen), name: chosen.name, size: chosen.size, note });
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
          "flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed p-6 text-center transition",
          dragging ? "border-primary bg-primary/5" : "hover:border-foreground/30 hover:bg-muted/40",
          (invalid || error) && "border-destructive/60",
          preview && "hidden",
        )}
      >
        <ImageUp className="size-8 text-muted-foreground" aria-hidden />
        <span className="font-medium">Drop an image here or click to choose</span>
        <span className="text-sm text-muted-foreground">{working ? "Preparing your image…" : "JPG, PNG or WebP. Large photos are resized automatically."}</span>
      </label>
      <input
        ref={inputRef}
        id="image"
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        onChange={(event) => showFile(event.target.files?.[0])}
        required
      />

      {preview && (
        <div className="relative overflow-hidden rounded-3xl border bg-muted/40">
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a file that isn't uploaded yet */}
          <img src={preview.url} alt="Preview of the chosen image" className="mx-auto max-h-72 object-contain" />
          <div className="flex items-center justify-between gap-3 border-t bg-background px-3 py-2 text-sm">
            <span className="truncate">
              {preview.name}{" "}
              <span className="text-muted-foreground">
                ·{" "}
                {formatSize(preview.size)}
              </span>
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              <X aria-hidden /> Remove
            </Button>
          </div>
        </div>
      )}
      {preview?.note && <p className="mt-2 text-sm text-muted-foreground">{preview.note}</p>}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
