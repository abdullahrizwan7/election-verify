"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, GripVertical, Hand, Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { moveClaimAction } from "@/app/review/board-actions";
import { InputTypeIcon } from "@/components/input-type-icon";
import { ConfidenceMeter } from "@/components/review/confidence-meter";
import { VerdictBadge } from "@/components/verdict-badge";
import { domainOf, timeAgo } from "@/lib/format";
import type { SubmissionSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

type ColumnId = "new" | "open" | "review" | "done";

const COLUMNS: { id: ColumnId; title: string; hint: string; tone: string }[] = [
  { id: "new", title: "New", hint: "The system is gathering evidence", tone: "bg-tint-sky text-tint-sky-foreground" },
  { id: "open", title: "Needs review", hint: "Drag a claim to “In review” to take it", tone: "bg-tint-lime text-tint-lime-foreground" },
  { id: "review", title: "In review", hint: "Drop on “Published” to write the verdict", tone: "bg-tint-coral text-tint-coral-foreground" },
  { id: "done", title: "Published", hint: "Recently published verdicts", tone: "bg-tint-ink text-tint-ink-foreground" },
];

function columnOf(item: SubmissionSummary): ColumnId {
  if (item.status === "PUBLISHED") return "done";
  if (item.status === "NEEDS_REVIEW") return item.assigneeId ? "review" : "open";
  return "new";
}

type Drag = { id: string; from: ColumnId; x: number; y: number; dx: number; dy: number; width: number; over: ColumnId | null };

/**
 * The review board: claims move through New → Needs review → In review → Published.
 * Drag with a mouse, or press and hold on a phone. Every card also has buttons,
 * so it works with a keyboard or a screen reader too.
 */
export function ReviewBoard({ items: initial, userId, isAdmin }: { items: SubmissionSummary[]; userId: string; isAdmin: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  // When the server sends fresh data (after a refresh), start from it again.
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setItems(initial);
  }

  const canMove = (item: SubmissionSummary) => item.status === "NEEDS_REVIEW" && (!item.assigneeId || item.assigneeId === userId || isAdmin);

  /** Which drops are allowed from each column. */
  const allowed = (from: ColumnId, to: ColumnId) => (from === "open" && to === "review") || (from === "review" && (to === "open" || to === "done"));

  async function move(item: SubmissionSummary, to: ColumnId) {
    const from = columnOf(item);
    if (from === to) return;
    if (!allowed(from, to)) {
      toast.error(from === "new" ? "This claim is still being analysed." : "Take the claim first: drag it to “In review”.");
      return;
    }
    if (to === "done") {
      // Publishing needs a verdict and an explanation, so open the review page at the verdict form.
      router.push(`/review/${item.id}#verdict`);
      return;
    }
    const target = to === "review" ? "mine" : "open";
    const previous = items;
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, assigneeId: target === "mine" ? userId : null, assigneeName: target === "mine" ? "You" : null } : i)));
    setBusy(item.id);
    const result = await moveClaimAction(item.id, target);
    setBusy(null);
    if (!result.ok) {
      setItems(previous);
      toast.error(result.error);
      return;
    }
    toast.success(target === "mine" ? "You’re reviewing this claim." : "Claim is back in the queue.");
    startTransition(() => router.refresh());
  }

  // ── Pointer-based drag and drop (mouse, pen and touch) ──────────────────
  const pending = useRef<{ item: SubmissionSummary; startX: number; startY: number; el: HTMLElement; touch: boolean; timer?: number; ready: boolean } | null>(null);

  function columnAt(x: number, y: number): ColumnId | null {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-column]");
    return (el?.dataset.column as ColumnId | undefined) ?? null;
  }

  function begin(x: number, y: number) {
    const p = pending.current;
    if (!p) return;
    const rect = p.el.getBoundingClientRect();
    pointerY.current = y;
    setDrag({ id: p.item.id, from: columnOf(p.item), x, y, dx: x - rect.left, dy: y - rect.top, width: rect.width, over: columnOf(p.item) });
    navigator.vibrate?.(15);
  }

  function onPointerDown(event: React.PointerEvent<HTMLElement>, item: SubmissionSummary) {
    if (!canMove(item) || event.button !== 0 || (event.target as HTMLElement).closest("a,button")) return;
    const touch = event.pointerType === "touch";
    pending.current = { item, startX: event.clientX, startY: event.clientY, el: event.currentTarget, touch, ready: !touch };
    // On a phone, press and hold to pick a card up, so normal swipes still scroll the page.
    if (touch) {
      pending.current.timer = window.setTimeout(() => {
        if (pending.current) {
          pending.current.ready = true;
          begin(pending.current.startX, pending.current.startY);
        }
      }, 260);
    }
  }

  useEffect(() => {
    function onMove(event: PointerEvent) {
      const p = pending.current;
      if (!p) return;
      const moved = Math.hypot(event.clientX - p.startX, event.clientY - p.startY);
      if (!drag) {
        if (p.touch && !p.ready && moved > 8) {
          window.clearTimeout(p.timer);
          pending.current = null; // it was a scroll, not a drag
          return;
        }
        if (!p.touch && moved > 6) begin(event.clientX, event.clientY);
        return;
      }
      setDrag((d) => (d ? { ...d, x: event.clientX, y: event.clientY, over: columnAt(event.clientX, event.clientY) } : d));
      pointerY.current = event.clientY;
    }
    function onUp() {
      const p = pending.current;
      if (p) window.clearTimeout(p.timer);
      pending.current = null;
      if (drag) {
        const item = items.find((i) => i.id === drag.id);
        if (item && drag.over) void move(item, drag.over);
        setDrag(null);
      }
    }
    // While dragging on a phone, stop the page from scrolling under the finger.
    function onTouchMove(event: TouchEvent) {
      if (drag) event.preventDefault();
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("touchmove", onTouchMove);
    };
  });

  // While a card is lifted, scroll the page when the pointer is near the top or bottom edge.
  const pointerY = useRef(0);
  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging) return;
    let frame = 0;
    const tick = () => {
      const y = pointerY.current;
      const edge = 90;
      const speed = y < edge ? -Math.ceil((edge - y) / 6) : y > window.innerHeight - edge ? Math.ceil((y - (window.innerHeight - edge)) / 6) : 0;
      if (speed) window.scrollBy(0, speed);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [dragging]);

  const dragged = drag ? items.find((i) => i.id === drag.id) : null;

  return (
    <div className="relative">
      {/* Phones: columns stack, and the page scrolls by itself while you drag near an edge. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-tour="board">
        {COLUMNS.map((column) => {
          const list = items.filter((i) => columnOf(i) === column.id);
          const isTarget = drag && drag.over === column.id && column.id !== drag.from;
          const valid = drag ? allowed(drag.from, column.id) : false;
          return (
            <section
              key={column.id}
              data-column={column.id}
              aria-label={column.title}
              className={cn(
                "glass flex min-w-0 flex-col rounded-[1.75rem] bg-card p-3 ring-1 ring-foreground/[0.07] transition-[box-shadow,transform] duration-300",
                isTarget && valid && "-translate-y-1 shadow-[0_0_0_3px_var(--glow)]",
                isTarget && !valid && "shadow-[0_0_0_3px_oklch(0.65_0.2_25)]",
              )}
            >
              <header className="mb-3 flex items-center justify-between gap-2 px-1.5 pt-1">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-bold">
                    <span className={cn("inline-flex min-w-7 justify-center rounded-full px-2 py-0.5 text-xs font-bold", column.tone)}>{list.length}</span>
                    {column.title}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{column.hint}</p>
                </div>
              </header>
              <ul className="flex min-h-32 flex-1 flex-col gap-2.5">
                {list.length === 0 && (
                  <li className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-foreground/10 p-6 text-center text-xs text-muted-foreground">
                    {column.id === "review" ? "Drag a claim here to start reviewing it" : "Nothing here"}
                  </li>
                )}
                {list.map((item) => (
                  <Card
                    key={item.id}
                    item={item}
                    mine={item.assigneeId === userId}
                    movable={canMove(item)}
                    busy={busy === item.id}
                    lifted={drag?.id === item.id}
                    onPointerDown={(e) => onPointerDown(e, item)}
                    onTake={() => void move(item, "review")}
                    onRelease={() => void move(item, "open")}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {/* The card that follows the pointer while dragging */}
      {drag && dragged && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 rotate-[-2deg] rounded-2xl bg-card shadow-[0_30px_60px_-20px_rgba(10,14,12,0.55)] ring-2 ring-brand"
          style={{ left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.width }}
        >
          <CardBody item={dragged} />
        </div>
      )}
    </div>
  );
}

function Card({
  item,
  mine,
  movable,
  busy,
  lifted,
  onPointerDown,
  onTake,
  onRelease,
}: {
  item: SubmissionSummary;
  mine: boolean;
  movable: boolean;
  busy: boolean;
  lifted: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onTake: () => void;
  onRelease: () => void;
}) {
  const column = columnOf(item);
  return (
    <li
      onPointerDown={onPointerDown}
      className={cn(
        "group relative rounded-2xl bg-background/80 ring-1 ring-foreground/[0.07] transition-[opacity,transform] duration-200 select-none",
        movable && "cursor-grab active:cursor-grabbing",
        lifted && "opacity-30",
      )}
    >
      <CardBody item={item} />
      <div className="flex items-center gap-1.5 border-t border-foreground/[0.06] px-3 py-2">
        {movable && <GripVertical className="size-3.5 text-muted-foreground/60" aria-hidden />}
        {item.assigneeName ? (
          <span className="truncate text-xs font-semibold text-muted-foreground">{mine ? "You’re reviewing" : `${item.assigneeName} is reviewing`}</span>
        ) : (
          <span className="text-xs text-muted-foreground">{timeAgo(item.createdAt)}</span>
        )}
        <span className="ml-auto flex items-center gap-1">
          {busy && <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden />}
          {column === "open" && (
            <button type="button" onClick={onTake} className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-bold text-background">
              <Hand className="size-3" aria-hidden /> Take
            </button>
          )}
          {column === "review" && movable && (
            <button type="button" onClick={onRelease} className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.07] px-2.5 py-1 text-[11px] font-bold" title="Give back to the queue">
              <Undo2 className="size-3" aria-hidden /> Release
            </button>
          )}
          <Link
            href={column === "done" ? `/s/${item.id}` : `/review/${item.id}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
              column === "review" && mine ? "bg-brand text-brand-foreground" : "bg-foreground/[0.07]",
            )}
          >
            {column === "review" && mine ? "Write verdict" : "Open"} <ArrowRight className="size-3" aria-hidden />
          </Link>
        </span>
      </div>
    </li>
  );
}

function CardBody({ item }: { item: SubmissionSummary }) {
  const verdict = item.finalVerdict ?? item.aiVerdict;
  return (
    <div className="flex gap-3 p-3">
      <InputTypeIcon type={item.type} className="size-9 rounded-xl bg-foreground/[0.06]" />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm leading-snug font-semibold">{item.title}</p>
        <p className="mt-0.5 flex gap-2 truncate text-[11px] text-muted-foreground">
          {item.url && <span className="truncate">{domainOf(item.url)}</span>}
          {item.reportCount > 1 && <span className="shrink-0 font-semibold text-amber-700 dark:text-amber-300">Reported {item.reportCount}×</span>}
          {item.status === "FAILED" && <span className="shrink-0 font-semibold text-destructive">Failed</span>}
        </p>
        {verdict && (
          <div className="mt-2 flex items-center gap-2">
            <VerdictBadge verdict={verdict} />
            {!item.finalVerdict && <ConfidenceMeter value={item.aiConfidence} />}
          </div>
        )}
      </div>
    </div>
  );
}
