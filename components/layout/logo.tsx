import { cn } from "@/lib/utils";

/** The ElectionVerify mark: an orange shield with a tick, on a dark disc. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center justify-center rounded-full bg-foreground text-background", className)} aria-hidden>
      <svg viewBox="0 0 24 24" className="size-[58%]" fill="none">
        <path d="M12 2.5 19.5 5.3v6.2c0 4.6-3.1 8.4-7.5 10-4.4-1.6-7.5-5.4-7.5-10V5.3L12 2.5Z" fill="var(--glow)" />
        <path d="m8.4 12.2 2.5 2.5 4.8-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
