import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "brand" | "dark" | "ghost";
type Size = "md" | "sm";

const SURFACE: Record<Variant, string> = {
  brand: "bg-brand text-brand-foreground shadow-brand",
  dark: "bg-foreground text-background shadow-[0_14px_34px_-14px_rgba(0,0,0,0.6)]",
  ghost: "bg-card text-foreground ring-1 ring-foreground/10 backdrop-blur-xl",
};

const CHIP: Record<Variant, string> = {
  brand: "bg-white text-[color:var(--glow)]",
  dark: "bg-background text-foreground",
  ghost: "bg-foreground text-background",
};

const SIZE: Record<Size, { button: string; chip: string; icon: string }> = {
  md: { button: "h-12 gap-3 pl-6 pr-1.5 text-[15px]", chip: "size-9", icon: "size-4" },
  sm: { button: "h-10 gap-2.5 pl-4 pr-1 text-sm", chip: "size-8", icon: "size-3.5" },
};

/**
 * The site's pill call-to-action: lifts on hover, the arrow chip turns, and it
 * presses down when clicked. Use it for the one main action in a section.
 */
export function CtaButton({
  href,
  children,
  variant = "brand",
  size = "md",
  arrow = true,
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  className?: string;
}) {
  const s = SIZE[size];
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex items-center rounded-full font-semibold whitespace-nowrap outline-none",
        "transition-[transform,box-shadow] duration-300 ease-(--ease-out-soft) hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]",
        "focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        s.button,
        !arrow && "pr-6",
        SURFACE[variant],
        className,
      )}
    >
      <span>{children}</span>
      {arrow && (
        <span
          className={cn(
            "flex items-center justify-center rounded-full transition-transform duration-500 ease-(--ease-pop) group-hover:translate-x-0.5 group-hover:-rotate-[35deg]",
            s.chip,
            CHIP[variant],
          )}
        >
          <ArrowRight className={s.icon} aria-hidden />
        </span>
      )}
    </Link>
  );
}
