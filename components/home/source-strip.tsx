import { BadgeCheck, Landmark, Newspaper } from "lucide-react";

const SOURCES = [
  { name: "Election Commission of India", icon: Landmark },
  { name: "PIB Fact Check", icon: Landmark },
  { name: "Alt News", icon: BadgeCheck },
  { name: "BOOM", icon: BadgeCheck },
  { name: "FACTLY", icon: BadgeCheck },
  { name: "Newschecker", icon: BadgeCheck },
  { name: "Vishvas News", icon: BadgeCheck },
  { name: "AFP Fact Check", icon: BadgeCheck },
  { name: "The Hindu", icon: Newspaper },
  { name: "Indian Express", icon: Newspaper },
  { name: "Reuters", icon: Newspaper },
];

/** A slowly scrolling strip of the trusted sources we search (pauses on hover). */
export function SourceStrip() {
  const row = [...SOURCES, ...SOURCES];
  return (
    <section className="py-14" aria-label="Trusted sources we check against">
      <p className="mb-6 text-center text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        Evidence from trusted Indian sources
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <ul className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
          {row.map(({ name, icon: Icon }, i) => (
            <li
              key={`${name}-${i}`}
              aria-hidden={i >= SOURCES.length}
              className="flex items-center gap-2.5 rounded-full border bg-card px-5 py-3 text-base font-semibold whitespace-nowrap"
            >
              <Icon className="size-4 text-brand" aria-hidden />
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
