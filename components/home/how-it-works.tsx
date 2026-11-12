import { Bot, Megaphone, Send, UserCheck } from "lucide-react";

const STEPS = [
  {
    icon: Send,
    title: "1. You submit",
    text: "Paste a news link or a forwarded message, or upload a photo or screenshot.",
  },
  {
    icon: Bot,
    title: "2. AI gathers evidence",
    text: "We read the content, check the source, search fact-check databases and look for earlier copies of images.",
  },
  {
    icon: UserCheck,
    title: "3. A human reviews",
    text: "A trained reviewer reads the evidence and decides the verdict. The AI only makes a suggestion.",
  },
  {
    icon: Megaphone,
    title: "4. Verdict is published",
    text: "You get a clear rating with the evidence behind it, ready to share with friends and family.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-b bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <p className="mt-1 text-muted-foreground">From a doubtful message to a reviewed answer in four steps.</p>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-xl border bg-card p-5">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-medium">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
