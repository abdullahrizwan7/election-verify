"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ImageUp } from "lucide-react";
import { toast } from "sonner";
import { readTransfer, setCapture, type Capture } from "@/lib/capture";

/** Quick capture works on the public pages, not in the reviewer workspace. */
const PUBLIC_PATHS = /^\/($|verified|s\/|submit|about|my)/;

/**
 * Drop or paste a claim anywhere on the public pages:
 * - drag a photo, screenshot, link or text onto the page: it opens Submit, filled in;
 * - paste (Ctrl/⌘+V) outside a text field: on Submit it fills the form, elsewhere it offers "Check it".
 */
export function QuickCapture() {
  const pathname = usePathname();
  const router = useRouter();
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  const enabled = PUBLIC_PATHS.test(pathname);

  useEffect(() => {
    if (!enabled) return;

    const open = (capture: Capture) => {
      setCapture(capture);
      if (pathname !== "/submit") router.push("/submit");
    };
    const carriesSomething = (event: DragEvent) =>
      [...(event.dataTransfer?.types ?? [])].some((t) => t === "Files" || t === "text/uri-list" || t === "text/plain");

    function onDragEnter(event: DragEvent) {
      if (!carriesSomething(event)) return;
      depth.current += 1;
      setOver(true);
    }
    function onDragOver(event: DragEvent) {
      if (carriesSomething(event)) event.preventDefault(); // allows dropping
    }
    function onDragLeave() {
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setOver(false);
    }
    function onDrop(event: DragEvent) {
      depth.current = 0;
      setOver(false);
      // Drops onto the Submit page's own picker are handled by the picker.
      if ((event.target as HTMLElement | null)?.closest?.("[data-dropzone]")) return;
      const capture = readTransfer(event.dataTransfer);
      if (!capture) return;
      event.preventDefault();
      open(capture);
    }
    function onPaste(event: ClipboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("input, textarea, [contenteditable='true']")) return; // normal pasting into a field
      const capture = readTransfer(event.clipboardData);
      if (!capture) return;
      event.preventDefault();
      if (pathname === "/submit") return open(capture);
      const what = capture.kind === "IMAGE" ? "this pasted image" : capture.kind === "URL" ? "this pasted link" : "this pasted text";
      toast(`Check ${what}?`, { action: { label: "Check it", onClick: () => open(capture) } });
    }

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("paste", onPaste);
    };
  }, [enabled, pathname, router]);

  if (!over) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-6" aria-hidden>
      <div className="flex max-w-md flex-col items-center gap-3 rounded-[2.5rem] border-2 border-dashed border-brand bg-card p-10 text-center shadow-[0_40px_100px_-40px_rgba(10,14,12,0.5)]">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand text-brand-foreground">
          <ImageUp className="size-7" />
        </span>
        <p className="text-2xl font-bold tracking-tight">Drop to check it</p>
        <p className="text-sm text-muted-foreground">A photo, screenshot, link or forwarded text. We’ll open the Submit form with it filled in.</p>
      </div>
    </div>
  );
}
