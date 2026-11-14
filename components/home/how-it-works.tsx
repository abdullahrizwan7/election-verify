import { Bot, Megaphone, Send, UserCheck } from "lucide-react";
import { Reveal } from "@/components/fx/reveal";
import { TiltCard } from "@/components/fx/tilt-card";
import { T } from "@/components/i18n";
import type { MessageKey } from "@/lib/i18n/dictionaries";

const STEPS: { icon: typeof Send; title: MessageKey; text: MessageKey }[] = [
  { icon: Send, title: "how.1.title", text: "how.1.text" },
  { icon: Bot, title: "how.2.title", text: "how.2.text" },
  { icon: UserCheck, title: "how.3.title", text: "how.3.text" },
  { icon: Megaphone, title: "how.4.title", text: "how.4.text" },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-20" data-tour="how">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <p className="text-sm font-medium tracking-widest text-glow uppercase">
            <T k="how.eyebrow" />
          </p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            <T k="how.title" />
          </h2>
          <p className="mt-1 text-muted-foreground">
            <T k="how.subtitle" />
          </p>
        </Reveal>

        <ol className="relative mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* The glowing line that links the steps on wide screens */}
          <div
            aria-hidden
            className="absolute top-10 right-[12%] left-[12%] hidden h-px bg-gradient-to-r from-transparent via-glow/60 to-transparent lg:block"
          />
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <li key={title}>
              <Reveal delay={index * 120} className="h-full">
                <TiltCard>
                  <div className="h-full rounded-xl border bg-card p-6 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <span className="relative flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-glow/25 to-glow-2/25 text-glow ring-1 ring-glow/30">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="font-mono text-3xl font-semibold text-foreground/10">0{index + 1}</span>
                    </div>
                    <h3 className="mt-5 font-medium">
                      <T k={title} />
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      <T k={text} />
                    </p>
                  </div>
                </TiltCard>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
