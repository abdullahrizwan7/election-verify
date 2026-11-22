"use client";

import { ClipboardCheck, Send, ShieldCheck } from "lucide-react";
import { SplitReveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

const ROLES = [
  {
    role: "Citizens",
    icon: Send,
    tone: "bg-tint-coral text-tint-coral-foreground",
    text: "Anyone who gets a doubtful message. Paste a link, a forward or a screenshot and follow the check live.",
    points: ["Submit in ten seconds", "Track every step", "Share the verdict"],
  },
  {
    role: "Reviewers",
    icon: ClipboardCheck,
    tone: "bg-tint-sky text-tint-sky-foreground",
    text: "Trained fact-checkers. The AI gathers the evidence and suggests a rating, but a reviewer always decides.",
    points: ["Evidence board", "AI suggestion with citations", "Publish in plain words"],
  },
  {
    role: "Admins",
    icon: ShieldCheck,
    tone: "bg-tint-lime text-tint-lime-foreground",
    text: "Keep the system trustworthy: choose the reviewers and the trusted sources, and see every action in the log.",
    points: ["Trusted sources list", "Reviewer access", "Audit log"],
  },
];

/** The three roles in the flow, from a doubtful message to a published answer. */
export function TeamVoices() {
  return (
    <section id="roles" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-brand uppercase">Three roles</p>
          <h2 className="mt-3 text-4xl leading-[1] font-bold tracking-tight md:text-6xl">
            <SplitReveal inView text="One trusted answer." />
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">Everyone signs in the same way. What you can do depends on your role.</p>
        </div>
        <Stagger className="grid gap-4 md:grid-cols-3 md:gap-5" gap={0.1}>
          {ROLES.map(({ role, icon: Icon, tone, text, points }) => (
            <StaggerItem key={role} variant="pop">
              <div className="glass group flex h-full flex-col rounded-[2rem] bg-card p-7 ring-1 ring-foreground/[0.07] transition-transform duration-500 ease-(--ease-out-soft) hover:-translate-y-1.5 md:p-8">
                <span className={cn("flex size-14 items-center justify-center rounded-2xl transition-transform duration-500 ease-(--ease-pop) group-hover:scale-110 group-hover:-rotate-6", tone)}>
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-6 text-2xl font-bold tracking-tight">{role}</h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted-foreground">{text}</p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {points.map((point) => (
                    <li key={point} className="rounded-full bg-foreground/[0.06] px-3 py-1.5 text-xs font-semibold">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
