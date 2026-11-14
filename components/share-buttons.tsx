"use client";

import { Download, Link2, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Lets people pass a verdict on to the group chat the rumour came from. */
export function ShareButtons({ path, text, downloadPath }: { path: string; text: string; downloadPath?: string }) {
  // The full address is only known in the browser, so it's built when a button is clicked.
  const fullUrl = () => new URL(path, window.location.origin).toString();

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullUrl());
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy. Select the address bar and copy it instead.");
    }
  }

  function whatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${fullUrl()}`)}`, "_blank", "noopener,noreferrer");
  }

  async function shareMore() {
    if (typeof navigator.share === "function") {
      await navigator.share({ title: text, url: fullUrl() }).catch(() => {});
    } else {
      await copy();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Share this result:</span>
      <Button variant="outline" size="sm" onClick={whatsApp}>
        <MessageCircle aria-hidden /> WhatsApp
      </Button>
      <Button variant="outline" size="sm" onClick={copy}>
        <Link2 aria-hidden /> Copy link
      </Button>
      <Button variant="outline" size="sm" onClick={shareMore}>
        <Share2 aria-hidden /> More
      </Button>
      {downloadPath && (
        <Button variant="outline" size="sm" asChild>
          <a href={downloadPath} download>
            <Download aria-hidden /> Download image
          </a>
        </Button>
      )}
    </div>
  );
}
