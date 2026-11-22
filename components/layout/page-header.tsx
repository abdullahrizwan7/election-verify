import { cn } from "@/lib/utils";

/**
 * How every page opens: a small eyebrow chip, a big bold title (the second
 * part muted), one line of description, and actions on the right.
 */
export function PageHeader({
  eyebrow,
  icon: Icon,
  title,
  muted,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  muted?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-5", className)}>
      <div className="max-w-3xl min-w-0">
        {eyebrow && (
          <span className="glass mb-4 inline-flex items-center gap-2 rounded-full bg-card px-3.5 py-1.5 text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase ring-1 ring-foreground/[0.07]">
            {Icon && <Icon className="size-3.5 text-brand" />}
            {eyebrow}
          </span>
        )}
        <h1 className="text-4xl leading-[1.02] font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">
          {title}
          {muted && (
            <>
              {" "}
              <span className="text-muted-foreground/70">{muted}</span>
            </>
          )}
        </h1>
        {description && <p className="mt-3 max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
