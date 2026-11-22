"use client";

import { Quote } from "lucide-react";
import { SplitReveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

const PEOPLE = [
  {
    name: "Sandeep",
    role: "Citizen",
    image: "/team/sandeep.png",
    tone: "bg-tint-coral text-tint-coral-foreground",
    quote: "A message in my family group said voting closes at 2 PM. I pasted it in, and a minute later I could see what the Election Commission actually said.",
  },
  {
    name: "Uday",
    role: "Reviewer",
    image: "/team/uday.png",
    tone: "bg-tint-sky text-tint-sky-foreground",
    quote: "The AI gathers the evidence and suggests a verdict, but I make the call. Every source is right there on the evidence board.",
  },
  {
    name: "Abdullah Rizwan",
    role: "Admin",
    image: "/team/abdullah.png",
    tone: "bg-tint-lime text-tint-lime-foreground",
    quote: "I choose the reviewers and the trusted sources, and every action is logged. That is what makes the verdicts safe to share.",
  },
];

/** Three people, three roles: the team behind every verdict. */
export function TeamVoices() {
  return (
    <section id="team" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-brand uppercase">Three roles</p>
          <h2 className="mt-3 text-4xl leading-[1] font-bold tracking-tight md:text-6xl">
            <SplitReveal inView text="One trusted answer." />
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">Built by Abdullah Rizwan, Uday and Sandeep. Each of us plays one part of the flow.</p>
        </div>
        <Stagger className="grid gap-4 md:grid-cols-3 md:gap-5" gap={0.1}>
          {PEOPLE.map((person) => (
            <StaggerItem key={person.name} variant="pop">
              <figure className="glass group flex h-full flex-col rounded-[2rem] bg-card p-7 ring-1 ring-foreground/[0.07] transition-transform duration-500 ease-(--ease-out-soft) hover:-translate-y-1.5 md:p-8">
                <Quote className="size-8 text-brand" aria-hidden />
                <blockquote className="mt-5 flex-1 text-lg leading-relaxed font-medium text-pretty">“{person.quote}”</blockquote>
                <figcaption className="mt-8 flex items-center gap-3.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={person.image}
                    alt={person.name}
                    className={cn("size-14 rounded-2xl object-cover transition-transform duration-500 ease-(--ease-pop) group-hover:scale-105 group-hover:-rotate-3", person.tone)}
                  />
                  <div>
                    <p className="font-bold">{person.name}</p>
                    <span className={cn("mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold", person.tone)}>{person.role}</span>
                  </div>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
