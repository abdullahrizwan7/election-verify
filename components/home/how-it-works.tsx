import { Bot, Megaphone, Send, UserCheck } from "lucide-react";
import { Reveal } from "@/components/fx/reveal";
import { TiltCard } from "@/components/fx/tilt-card";

const STEPS = [
  {
    icon: Send,
    title: "You submit",
    text: "Paste a news link or a forwarded message, or upload a photo or screenshot.",
  },
  {
    icon: Bot,
    title: "AI gathers evidence",
    text: "We read the content, check the source, search fact-checks and look for earlier copies of images.",
  },
  {
    icon: UserCheck,
    title: "A human reviews",
    text: "A trained reviewer reads the evidence and decides the verdict. The AI only makes a suggestion.",
  },
  {
    icon: Megaphone,
    title: "Verdict is published",
    text: "You get a clear rating with the evidence behind it, ready to share with friends and family.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <p className="text-sm font-medium tracking-widest text-glow uppercase">Process</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">How it works</h2>
          <p className="mt-1 text-muted-foreground">From a doubtful message to a reviewed answer in four steps.</p>
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
                    <h3 className="mt-5 font-medium">{title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
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
