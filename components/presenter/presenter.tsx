"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, PlayCircle, Presentation, X } from "lucide-react";
import { isTyping } from "@/components/command-palette";
import { TOUR } from "@/components/presenter/steps";
import { cn } from "@/lib/utils";
import { T } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/**
 * Presenter mode: a guided tour for showing the project to an audience.
 * The current step is kept in sessionStorage so the tour survives page
 * changes. Start it from the home page, the command palette, or any URL
 * with ?tour=1.
 */

const KEY = "ev-tour";
type TourState = { step: number; created?: string };

// A tiny store around sessionStorage that React can subscribe to.
const listeners = new Set<() => void>();
function readTour(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}
function writeTour(state: TourState | null) {
  try {
    if (state) sessionStorage.setItem(KEY, JSON.stringify(state));
    else sessionStorage.removeItem(KEY);
  } catch {
    // Private browsing can block storage. The tour then just doesn't persist.
  }
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function Presenter() {
  const router = useRouter();
  const pathname = usePathname();
  const raw = useSyncExternalStore(subscribe, readTour, () => null);
  const tour: TourState | null = raw ? JSON.parse(raw) : null;
  const step = tour ? TOUR[tour.step] : null;
  const [rect, setRect] = useState<DOMRect | null>(null);

  const goTo = useCallback(
    (index: number, created = tour?.created) => {
      const next = TOUR[index];
      if (!next) return;
      writeTour({ step: index, created });
      const path = next.path.replace("{created}", created ?? "polling-hours-message");
      if (path.startsWith("/demo/")) {
        window.location.assign(path); // switches the demo account on the server, then redirects
      } else if (!next.match.test(window.location.pathname) || path.includes("#")) {
        router.push(path);
      }
    },
    [router, tour?.created],
  );

  const start = useCallback(() => {
    writeTour({ step: 0 });
    router.push(TOUR[0].path);
  }, [router]);

  // Start from the command palette or the home page button, or from ?tour=1.
  useEffect(() => {
    window.addEventListener("ev:start-tour", start);
    if (new URLSearchParams(window.location.search).get("tour") === "1") start();
    return () => window.removeEventListener("ev:start-tour", start);
  }, [start]);

  // After submitting in the submit step, remember the new item and move on.
  useEffect(() => {
    if (!tour || !step?.advanceOn || !step.advanceOn.test(pathname)) return;
    writeTour({ step: tour.step + 1, created: pathname.split("/")[2] });
  }, [pathname, tour, step]);

  // Keyboard: → next, ← back, Esc exit.
  useEffect(() => {
    if (!tour) return;
    function onKey(event: KeyboardEvent) {
      if (isTyping(event.target)) return;
      if (event.key === "ArrowRight") goTo(tour!.step + 1);
      if (event.key === "ArrowLeft" && tour!.step > 0) goTo(tour!.step - 1);
      if (event.key === "Escape") writeTour(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tour, goTo]);

  // Find the element to spotlight, scroll to it, and follow it while the page moves.
  const onPage = Boolean(step && step.match.test(pathname));
  useEffect(() => {
    if (!step?.target || !onPage) {
      const frame = requestAnimationFrame(() => setRect(null));
      return () => cancelAnimationFrame(frame);
    }
    let frame = 0;
    let scrolled = false;
    const follow = () => {
      const el = document.querySelector(step.target!);
      if (el) {
        if (!scrolled) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          scrolled = true;
        }
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, [step, onPage, pathname]);

  if (!tour || !step) return null;
  const last = tour.step === TOUR.length - 1;

  return (
    <>
      {rect && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[60] rounded-2xl ring-2 ring-glow transition-all duration-300"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            boxShadow: "0 0 0 9999px rgb(2 6 23 / 0.55), 0 0 40px 4px color-mix(in oklch, var(--glow) 50%, transparent)",
          }}
        />
      )}

      <div
        role="dialog"
        aria-label="Presenter mode"
        className="fixed right-4 bottom-4 z-[70] w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-glow/40 bg-popover/95 p-5 shadow-[0_20px_60px_-15px_color-mix(in_oklch,var(--glow)_45%,transparent)] backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.2em] text-glow uppercase">
            <Presentation className="size-3.5" aria-hidden /> Presenter mode · {tour.step + 1} / {TOUR.length}
          </p>
          <Button variant="ghost" size="icon-sm" onClick={() => writeTour(null)} aria-label="Exit presenter mode">
            <X aria-hidden />
          </Button>
        </div>
        <h2 className="mt-2 text-lg font-semibold tracking-tight">{step.title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

        <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-glow to-glow-2 transition-all duration-500" style={{ width: `${((tour.step + 1) / TOUR.length) * 100}%` }} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" disabled={tour.step === 0} onClick={() => goTo(tour.step - 1)}>
            <ArrowLeft aria-hidden /> Back
          </Button>
          {!onPage ? (
            <Button size="sm" onClick={() => goTo(tour.step)}>
              Go to this step <ArrowRight aria-hidden />
            </Button>
          ) : last ? (
            <Button size="sm" onClick={() => writeTour(null)}>
              Finish
            </Button>
          ) : (
            <Button size="sm" className="glow" onClick={() => goTo(tour.step + 1)} disabled={Boolean(step.advanceOn)}>
              {step.advanceOn ? "Waiting for submit…" : "Next"} {!step.advanceOn && <ArrowRight aria-hidden />}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * "Watch the guided demo" button for the home page. Opens the one-minute
 * animated video (made from video/intro.html with `npm run video`), with a
 * link to the live presenter tour underneath.
 */
export function StartTourButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className={cn("glass h-11 gap-2.5 rounded-full bg-card pr-5 pl-1.5 ring-1 ring-foreground/[0.07] hover:bg-card hover:text-foreground", className)}>
          <span className="flex size-8 items-center justify-center rounded-full bg-foreground text-background">
            <PlayCircle className="size-4" aria-hidden />
          </span>
          <T k="hero.tour" />
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogTitle className="sr-only">ElectionVerify in one minute</DialogTitle>
        <DialogDescription className="sr-only">
          An animated video showing how a claim is submitted, checked with evidence and reviewed by a person.
        </DialogDescription>
        {/* Narrated video; every spoken line also appears on screen as a speech bubble. */}
        <video
          src="/videos/electionverify-intro.mp4"
          poster="/videos/electionverify-intro-poster.jpg"
          controls
          autoPlay
          playsInline
          preload="metadata"
          className="aspect-video w-full bg-black"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="text-sm text-muted-foreground">Meet Veri, Sandeep, Uday and Abdullah Rizwan.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new Event("ev:start-tour"));
            }}
          >
            <Presentation aria-hidden /> Take the live tour instead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
