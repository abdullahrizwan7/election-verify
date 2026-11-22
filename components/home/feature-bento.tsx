import { Bot, Globe2, ImageIcon, Layers, UserCheck } from "lucide-react";
import { Reveal } from "@/components/fx/reveal";
import { cn } from "@/lib/utils";

/**
 * "Engineered for trusted answers": a bento grid of tinted feature cards
 * (Cognify-inspired), each with a small visual.
 */
export function FeatureBento() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <Reveal className="mb-12 text-center">
        <h2 className="text-4xl leading-[1.05] font-bold tracking-tight sm:text-6xl">
          Engineered for
          <br />
          <span className="text-muted-foreground/70">answers you can trust.</span>
        </h2>
      </Reveal>

      <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
        {/* Big card: source and claim checks */}
        <Reveal className="md:col-span-2">
          <Card tint="olive" icon={Layers} title="Smart claim checks" text="Every link, message or screenshot is read, split into separate claims and matched against trusted sources.">
            <div className="mt-6 flex flex-wrap gap-2">
              {["Source reputation", "Domain age", "Claims", "Fact-checks", "Web evidence"].map((chip) => (
                <span key={chip} className="rounded-full bg-black/15 px-3 py-1.5 text-xs font-medium dark:bg-white/10">
                  {chip}
                </span>
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal delay={100}>
          <Card tint="steel" icon={Bot} title="AI with citations" text="Gemini suggests a verdict and cites every piece of evidence it used. It never publishes on its own.">
            <div className="mt-6 space-y-2" aria-hidden>
              {[90, 70, 82].map((w, i) => (
                <div key={i} className="h-2.5 rounded-full bg-black/15 dark:bg-white/15" style={{ width: `${w}%` }} />
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal delay={150}>
          <Card tint="rust" icon={ImageIcon} title="Image forensics" text="Reads the text in screenshots, checks photo details and looks for older copies of the image.">
            <div className="mt-6 flex h-14 items-end gap-2" aria-hidden>
              {[40, 70, 50, 95, 60].map((h, i) => (
                <div key={i} className="flex-1 rounded-md bg-black/15 dark:bg-white/15" style={{ height: `${h}%` }} />
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal delay={200} className="md:col-span-2">
          <Card tint="ink" icon={UserCheck} title="A human makes the call" text="Trained reviewers read the evidence, choose the verdict and explain it in plain words. Every action is logged.">
            <svg viewBox="0 0 400 60" className="mt-6 h-12 w-full max-w-md" aria-hidden>
              <path d="M10 40 C 80 10, 140 55, 200 30 S 320 10, 390 35" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth="2" strokeDasharray="4 6" />
              {[10, 110, 200, 300, 390].map((x, i) => (
                <circle key={i} cx={x} cy={[40, 26, 30, 18, 35][i]} r="6" fill="var(--glow)" opacity={i === 4 ? 1 : 0.55} />
              ))}
            </svg>
          </Card>
        </Reveal>
      </div>

      <Reveal delay={250} className="mt-4">
        <div className="flex flex-col items-start gap-4 rounded-[1.75rem] border bg-card p-6 sm:flex-row sm:items-center">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand">
            <Globe2 className="size-5" aria-hidden />
          </span>
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">English, हिन्दी and اردو.</span> Results are free to read, search and share, on any phone.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

const TINTS = {
  olive: "bg-tint-olive text-tint-olive-foreground",
  rust: "bg-tint-rust text-tint-rust-foreground",
  steel: "bg-tint-steel text-tint-steel-foreground",
  ink: "bg-tint-ink text-tint-ink-foreground",
} as const;

function Card({
  tint,
  icon: Icon,
  title,
  text,
  children,
}: {
  tint: keyof typeof TINTS;
  icon: typeof Bot;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("flex h-full flex-col rounded-[1.75rem] p-7 transition-transform duration-500 ease-(--ease-out-soft) hover:-translate-y-1", TINTS[tint])}>
      <span className="flex size-11 items-center justify-center rounded-2xl bg-black/15 dark:bg-white/12">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="mt-6 text-2xl font-bold tracking-tight">{title}</h3>
      <p className="mt-2 max-w-md text-[15px] opacity-80">{text}</p>
      {children}
    </div>
  );
}
