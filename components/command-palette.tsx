"use client";

import { LANGS } from "@/lib/i18n/dictionaries";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Database,
  Home,
  Inbox,
  Keyboard,
  Languages,
  ListChecks,
  MoonStar,
  PlayCircle,
  Search,
  Send,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VerdictBadge } from "@/components/verdict-badge";
import type { Verdict } from "@/lib/types";

const PAGES = [
  { label: "Home", href: "/", icon: Home },
  { label: "Verified claims", href: "/verified", icon: ShieldCheck },
  { label: "Submit a claim", href: "/submit", icon: Send },
  { label: "My submissions", href: "/my", icon: Inbox },
  { label: "Our method", href: "/about", icon: BookOpen },
  { label: "Review queue", href: "/review", icon: ClipboardCheck },
  { label: "Analytics", href: "/review/analytics", icon: BarChart3 },
  { label: "Trusted sources", href: "/admin/sources", icon: Database },
  { label: "Activity log", href: "/admin/activity", icon: ListChecks },
  { label: "Setup", href: "/admin/setup", icon: Settings2 },
];

export const SHORTCUTS: [keys: string, action: string][] = [
  ["Ctrl / ⌘ + K", "Open this command palette"],
  ["/", "Search verified claims"],
  ["?", "Show keyboard shortcuts"],
  ["J / K", "Review queue: move down / up"],
  ["1 – 6", "Review screen: pick a verdict"],
  ["Ctrl / ⌘ + Enter", "Review screen: publish the verdict"],
  ["→ / ←", "Presenter mode: next / previous step"],
];

/** True when the user is typing, so single-key shortcuts don't fire inside text boxes. */
export function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)));
}

type Result = { id: string; title: string; verdict: Verdict | null };

/** Ctrl/⌘ + K anywhere: jump to a page, run an action, or search verified claims. */
export function CommandPalette() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (!isTyping(event.target) && event.key === "/") {
        event.preventDefault();
        setOpen(true);
      } else if (!isTyping(event.target) && event.key === "?") {
        setHelpOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Search published claims as the user types (after a short pause).
  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((data: { results: Result[] }) => setResults(data.results))
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function run(action: () => void) {
    setOpen(false);
    setQuery("");
    action();
  }

  const visibleResults = query.trim().length >= 2 ? results : [];

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="hidden h-9 w-40 justify-start gap-2 rounded-full bg-foreground/[0.05] px-3 font-medium text-muted-foreground hover:bg-foreground/[0.08] xl:inline-flex"
      >
        <Search aria-hidden /> Search…
        <kbd className="ml-auto rounded-md bg-background/70 px-1.5 font-mono text-[10px]">⌘K</kbd>
      </Button>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="rounded-full xl:hidden" aria-label="Search and commands">
        <Search aria-hidden />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Search and commands" description="Find a verdict, open a page or run an action.">
        <Command>
          <CommandInput placeholder="Search claims, pages and actions…" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>Nothing found.</CommandEmpty>
            {visibleResults.length > 0 && (
              <CommandGroup heading="Verified claims">
                {visibleResults.map((r) => (
                  <CommandItem key={r.id} value={`claim ${r.id} ${r.title}`} keywords={[query]} onSelect={() => run(() => router.push(`/s/${r.id}`))}>
                    <ShieldCheck aria-hidden />
                    <span className="truncate">{r.title}</span>
                    {r.verdict && <VerdictBadge verdict={r.verdict} className="ml-auto" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandGroup heading="Go to">
              {PAGES.map(({ label, href, icon: Icon }) => (
                <CommandItem key={href} value={`page ${label}`} onSelect={() => run(() => router.push(href))}>
                  <Icon aria-hidden /> {label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem value="action start presenter demo tour" onSelect={() => run(() => window.dispatchEvent(new Event("ev:start-tour")))}>
                <PlayCircle aria-hidden /> Start presenter mode (guided demo)
              </CommandItem>
              <CommandItem value="action toggle dark light theme" onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}>
                <MoonStar aria-hidden /> Switch light / dark mode
              </CommandItem>
              {LANGS.map(({ code, name, english }) => (
                <CommandItem key={code} value={`action language ${english} ${name}`} onSelect={() => run(() => window.dispatchEvent(new CustomEvent("ev:set-lang", { detail: code })))}>
                  <Languages aria-hidden /> Language: {code === "en" ? name : `${name} (${english})`}
                </CommandItem>
              ))}
              <CommandItem value="action keyboard shortcuts help" onSelect={() => run(() => setHelpOpen(true))}>
                <Keyboard aria-hidden /> Keyboard shortcuts
                <CommandShortcut>?</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="size-4 text-glow" aria-hidden /> Keyboard shortcuts
            </DialogTitle>
            <DialogDescription>Work faster without the mouse.</DialogDescription>
          </DialogHeader>
          <dl className="space-y-2 text-sm">
            {SHORTCUTS.map(([keys, action]) => (
              <div key={keys} className="flex items-center justify-between gap-4 border-b pb-2 last:border-0">
                <dt className="text-muted-foreground">{action}</dt>
                <dd>
                  <kbd className="rounded border bg-muted px-2 py-0.5 font-mono text-xs">{keys}</kbd>
                </dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
    </>
  );
}
