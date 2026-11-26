import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Bot, CheckCircle2, LogIn, Megaphone, Send, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SubmitForm } from "@/components/submit/submit-form";
import { T } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";

/** Checking a claim runs after the response is sent; give it up to a minute on the server. */
export const maxDuration = 60;

export const metadata: Metadata = { title: "Submit a claim" };

const TIPS = ["submit.tip1", "submit.tip2", "submit.tip3", "submit.tip4"] as const;

const NEXT = [
  { icon: Send, title: "submit.next.1", text: "submit.next.1.when", tone: "bg-tint-lime text-tint-lime-foreground" },
  { icon: Bot, title: "submit.next.2", text: "submit.next.2.when", tone: "bg-tint-sky text-tint-sky-foreground" },
  { icon: UserCheck, title: "submit.next.3", text: "submit.next.3.when", tone: "bg-tint-coral text-tint-coral-foreground" },
  { icon: Megaphone, title: "submit.next.4", text: "submit.next.4.when", tone: "bg-brand text-brand-foreground" },
] as const;

export default function SubmitPage() {
  return (
    <main className="page-enter mx-auto max-w-7xl space-y-10 px-4 pt-10 pb-16 sm:px-6 md:pt-16">
      <PageHeader
        eyebrow={<T k="submit.eyebrow" />}
        icon={Send}
        title={<T k="submit.heading" />}
        muted={<T k="submit.muted" />}
        description={<T k="submit.subtitle" />}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_380px] [&>*]:min-w-0">
        <div className="glass rounded-[2.5rem] bg-card p-6 ring-1 ring-foreground/[0.07] shadow-[0_40px_100px_-50px_rgba(10,14,12,0.45)] sm:p-9" data-tour="submit-form">
          <Suspense fallback={<Skeleton className="h-80 w-full rounded-3xl" />}>
            <SubmitGate />
          </Suspense>
        </div>

        <aside className="space-y-5">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-tint-ink p-7 text-tint-ink-foreground">
            <div aria-hidden className="orb pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-brand/35 blur-[80px]" />
            <h2 className="relative text-xl font-bold tracking-tight">
              <T k="submit.next.title" />
            </h2>
            <ol className="relative mt-5 space-y-3">
              {NEXT.map(({ icon: Icon, title, text, tone }, index) => (
                <li key={title} className="flex items-center gap-3.5 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">
                      <T k={title} />
                    </p>
                    <p className="text-xs text-white/55">
                      <T k="submit.step" /> {index + 1} · <T k={text} />
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-[2.5rem] bg-tint-lime p-7 text-tint-lime-foreground">
            <h2 className="text-xl font-bold tracking-tight">
              <T k="submit.tips.title" />
            </h2>
            <ul className="mt-4 space-y-3 text-[15px] font-medium">
              {TIPS.map((tip) => (
                <li key={tip} className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 size-[18px] shrink-0 opacity-70" aria-hidden />
                  <T k={tip} />
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}

/** Shows the form to signed-in people, and a sign-in prompt to everyone else. */
async function SubmitGate() {
  const user = await getCurrentUser();
  if (user) return <SubmitForm />;

  return (
    <div className="flex flex-col items-center gap-4 py-14 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-tint-sky text-tint-sky-foreground">
        <LogIn className="size-7" aria-hidden />
      </span>
      <h2 className="text-3xl font-bold tracking-tight">
        <T k="submit.signin.title" />
      </h2>
      <p className="max-w-sm text-muted-foreground">
        <T k="submit.signin.text" />
      </p>
      <Button asChild size="lg" className="mt-2 rounded-full px-7">
        <Link href="/login?next=/submit">
          <T k="nav.signin" />
        </Link>
      </Button>
    </div>
  );
}
