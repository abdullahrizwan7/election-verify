import type { Metadata } from "next";
import Link from "next/link";
import { Bot, FileSearch, Lock, RefreshCw, Scale, ShieldAlert, UserCheck } from "lucide-react";
import { RatingsLegend } from "@/components/home/ratings-legend";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Our method",
  description: "How ElectionVerify checks claims, how AI is used, and how we handle corrections and privacy.",
};

const PRINCIPLES = [
  {
    icon: Scale,
    title: "Nonpartisan",
    text: "We check claims about every party and candidate the same way. Who said something never changes the rules we apply.",
  },
  {
    icon: FileSearch,
    title: "Evidence you can see",
    text: "Every verdict links to its sources, so you can check our work yourself.",
  },
  {
    icon: UserCheck,
    title: "A human decides",
    text: "Software collects evidence and makes a suggestion. A trained reviewer reads it and decides. No verdict is published automatically.",
  },
];

const STEPS = [
  ["Read", "We open the link safely, or read the message or image you sent. For images we also read any text in the picture."],
  ["Check the source", "We look up the website in our list of official, news, fact-checking, satire and known false sources, and check how old the domain is."],
  ["Find the claims", "We split the content into statements that can be checked, such as dates, numbers and rules."],
  ["Gather evidence", "We search published fact-checks and news reports, and look for earlier copies of photos that may be reused."],
  ["Review", "A reviewer reads the evidence, can add their own (for example a call to the election office), and chooses a rating."],
  ["Publish", "The rating goes online with a plain explanation and the evidence behind it."],
];

export default function AboutPage() {
  return (
    <main>
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-14">
          <h1 className="text-4xl font-semibold tracking-tight text-balance">How we check election claims</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            ElectionVerify helps people check what they read about elections before they share it. Here is exactly how
            a claim goes from a forwarded message to a published verdict.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-14 px-4 py-14">
        <section className="grid gap-4 sm:grid-cols-3">
          {PRINCIPLES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border bg-card p-5">
              <Icon className="size-5 text-primary" aria-hidden />
              <h2 className="mt-3 font-medium">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Our process</h2>
          <ol className="space-y-3">
            {STEPS.map(([title, text], index) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </span>
                <p className="pt-0.5">
                  <span className="font-medium">{title}.</span> <span className="text-muted-foreground">{text}</span>
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Bot className="size-6 text-primary" aria-hidden /> How we use AI
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>AI helps us find the claims in long texts, describe images, and summarize the evidence.</li>
            <li>The AI’s suggestion is shown only to reviewers. It is never published as a verdict.</li>
            <li>Every point in the AI summary must cite a piece of evidence. Citations that don’t match real evidence are flagged for the reviewer.</li>
            <li>Text people send us is treated as material to check, never as instructions to the AI.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <RefreshCw className="size-6 text-primary" aria-hidden /> Corrections
          </h2>
          <p className="text-muted-foreground">
            If new evidence appears, a reviewer updates the verdict and the page shows the new date. Every change is
            recorded in our internal activity log. If you think we got something wrong, submit the evidence as a new
            claim and mention the result it relates to.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Lock className="size-6 text-primary" aria-hidden /> Privacy
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>We never show who submitted a claim.</li>
            <li>Location data found inside photos is never published.</li>
            <li>Uploaded images are stored privately and shown through links that expire.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <ShieldAlert className="size-6 text-primary" aria-hidden /> Limits
          </h2>
          <p className="text-muted-foreground">
            We can be wrong, and some claims can’t be confirmed quickly. Those are rated Unverified until better evidence
            exists. For voting dates, hours, places and rules, always confirm with your official election authority.
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/submit">Submit a claim</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/verified">See verified claims</Link>
          </Button>
        </div>
      </div>

      <RatingsLegend />
    </main>
  );
}
