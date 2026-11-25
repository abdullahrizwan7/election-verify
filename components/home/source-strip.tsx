import { T } from "@/components/i18n";

const SOURCES = [
  "Election Commission of India",
  "PIB Fact Check",
  "Alt News",
  "BOOM",
  "FACTLY",
  "Newschecker",
  "Vishvas News",
  "AFP Fact Check",
  "The Hindu",
  "Indian Express",
  "Reuters",
];

/** A slowly scrolling row of the trusted sources we search (pauses on hover). */
export function SourceStrip() {
  const row = [...SOURCES, ...SOURCES];
  return (
    <section className="py-16" aria-label="Trusted sources we check against">
      <p className="mb-8 text-center text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
        <T k="sources.title" />
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <ul className="flex w-max animate-marquee items-center gap-12 hover:[animation-play-state:paused] md:gap-16">
          {row.map((name, i) => (
            <li
              key={`${name}-${i}`}
              aria-hidden={i >= SOURCES.length}
              className="text-2xl font-bold tracking-tight whitespace-nowrap text-foreground/35 transition-colors duration-300 hover:text-foreground md:text-3xl"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
