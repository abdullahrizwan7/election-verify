"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, History, Home, Inbox, Library, Plus, Settings2 } from "lucide-react";
import { Magnetic } from "@/components/motion/reveal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/review", label: "Review queue", icon: Inbox, exact: true },
  { href: "/review/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/sources", label: "Trusted sources", icon: Library },
  { href: "/admin/activity", label: "Activity log", icon: History },
];

const dockButton =
  "relative flex size-10 items-center justify-center rounded-full text-dock-foreground/60 outline-none transition-[color,background-color,transform] duration-200 hover:bg-white/10 hover:text-dock-foreground focus-visible:ring-2 focus-visible:ring-white/40 active:scale-95 data-[active=true]:bg-white/15 data-[active=true]:text-dock-foreground";

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={14}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * The reviewer workspace's slim dark rail, pinned to the left edge: an orange
 * "+" (submit a claim) on top and the workspace tools below.
 */
export function WorkspaceDock() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Workspace tools"
      className="dock-rail fixed top-1/2 left-4 z-30 hidden w-[52px] -translate-y-1/2 flex-col items-center gap-1.5 rounded-full bg-dock px-1.5 py-2 shadow-[0_18px_50px_-14px_rgba(10,14,12,0.5)] ring-1 ring-white/10 backdrop-blur-xl md:flex"
    >
      <Magnetic strength={0.25}>
        <Tip label="Submit a claim">
          <Link
            href="/submit"
            aria-label="Submit a claim"
            className="group mb-1.5 flex size-10 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-brand transition-transform duration-300 ease-(--ease-pop) hover:scale-110"
          >
            <Plus className="size-5 transition-transform duration-300 ease-(--ease-pop) group-hover:rotate-90" aria-hidden />
          </Link>
        </Tip>
      </Magnetic>
      {ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href || /^\/review\/(?!analytics)/.test(pathname) : pathname.startsWith(href);
        return (
          <Tip key={href} label={label}>
            <Link href={href} aria-label={label} data-active={active} className={dockButton}>
              <Icon className="size-[18px]" aria-hidden />
            </Link>
          </Tip>
        );
      })}
      <span className="my-1 h-px w-5 bg-white/15" />
      <Tip label="Setup">
        <Link href="/admin/setup" aria-label="Setup" data-active={pathname.startsWith("/admin/setup")} className={dockButton}>
          <Settings2 className="size-[18px]" aria-hidden />
        </Link>
      </Tip>
      <Tip label="Public site">
        <Link href="/" aria-label="Public site" className={cn(dockButton)}>
          <Home className="size-[18px]" aria-hidden />
        </Link>
      </Tip>
    </nav>
  );
}
