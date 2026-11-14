"use client";

import { useEffect } from "react";
import { isTyping } from "@/components/command-palette";

/** J / K move through the review queue, Enter opens the focused item (like Gmail). */
export function QueueKeys() {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key !== "j" && key !== "k") return;

      const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-queue-link]"));
      if (links.length === 0) return;
      const current = links.indexOf(document.activeElement as HTMLAnchorElement);
      const next = key === "j" ? Math.min(links.length - 1, current + 1) : Math.max(0, current === -1 ? 0 : current - 1);
      links[next].focus();
      links[next].scrollIntoView({ block: "nearest" });
      event.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
