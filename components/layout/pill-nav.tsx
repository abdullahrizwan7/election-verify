"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { BarChart3, BadgeCheck, BookOpen, History, House, Inbox, Library, Send } from "lucide-react";
import { T } from "@/components/i18n";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; key?: MessageKey; icon: typeof House; match?: (path: string) => boolean };

const PUBLIC: Item[] = [
  { href: "/", label: "Home", icon: House, match: (p) => p === "/" },
  { href: "/verified", label: "Verified", key: "nav.verified", icon: BadgeCheck, match: (p) => p.startsWith("/verified") || p.startsWith("/s/") },
  { href: "/submit", label: "Submit", key: "nav.submit", icon: Send, match: (p) => p.startsWith("/submit") || p.startsWith("/my") },
  { href: "/about", label: "Method", key: "nav.method", icon: BookOpen },
];

const WORKSPACE: Item[] = [
  { href: "/review", label: "Queue", icon: Inbox, match: (p) => p === "/review" || /^\/review\/(?!analytics)/.test(p) },
  { href: "/review/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/sources", label: "Sources", icon: Library },
  { href: "/admin/activity", label: "Activity", icon: History },
];

export function isWorkspace(path: string) {
  return path.startsWith("/review") || path.startsWith("/admin");
}

/**
 * The pill navigation. One black "active" chip slides to whichever link
 * matches the page (re-measured on route change and resize).
 */
export function PillNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const items = isWorkspace(pathname) ? WORKSPACE : PUBLIC;
  const active = items.findIndex((i) => (i.match ? i.match(pathname) : pathname.startsWith(i.href)));
  const [box, setBox] = useState<{ x: number; w: number } | null>(null);

  const measure = useCallback(() => {
    const el = active >= 0 ? ref.current?.querySelectorAll<HTMLElement>("[data-nav-link]")[active] : undefined;
    if (!el || !el.offsetWidth) return setBox(null);
    setBox((prev) => (prev && prev.x === el.offsetLeft && prev.w === el.offsetWidth ? prev : { x: el.offsetLeft, w: el.offsetWidth }));
  }, [active]);

  useLayoutEffect(measure, [measure, items]);
  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    nav.querySelectorAll("[data-nav-link]").forEach((link) => observer.observe(link));
    return () => observer.disconnect();
  }, [measure, items]);

  return (
    <nav
      ref={ref}
      aria-label="Main"
      className={cn("glass relative flex items-center gap-0.5 rounded-full bg-card p-1 ring-1 ring-foreground/[0.07]", className)}
    >
      {box && (
        <motion.span
          aria-hidden
          className="absolute top-1 bottom-1 left-0 rounded-full bg-foreground shadow-[0_6px_16px_-6px_rgba(0,0,0,0.45)]"
          initial={false}
          animate={{ x: box.x, width: box.w }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
      {items.map((item, i) => {
        const on = i === active;
        return (
          <Link
            key={item.href}
            href={item.href}
            data-nav-link
            aria-current={on ? "page" : undefined}
            className={cn(
              "relative z-10 flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-semibold whitespace-nowrap outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-ring/60 sm:px-4",
              on ? (box ? "text-background" : "text-foreground") : "text-muted-foreground hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" aria-hidden />
            <span className={cn("sm:inline", on ? "inline" : "hidden")}>{item.key ? <T k={item.key} /> : item.label}</span>
            {on && <span className="size-1.5 rounded-full bg-brand" aria-hidden />}
          </Link>
        );
      })}
    </nav>
  );
}
