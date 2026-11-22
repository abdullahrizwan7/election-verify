import type { Metadata } from "next";
import { Suspense } from "react";
import { AlertCircle, ClipboardCheck, LockKeyhole, UserRound, UsersRound } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { DemoLoginPanel } from "@/components/auth/demo-login-panel";
import { GoogleButton } from "@/components/auth/google-button";
import { MagicLinkForm } from "@/components/auth/magic-link-form";
import { Globe } from "@/components/fx/globe";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { signInWithGoogle } from "@/app/(auth)/actions";
import { hasSupabase } from "@/lib/config";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, { title: string; text: string }> = {
  forbidden: { title: "You don't have access to that page", text: "Sign in with a reviewer or admin account to continue." },
  link: { title: "That sign-in link didn't work", text: "It may have expired. Ask for a new link below." },
  oauth: { title: "Google sign-in failed", text: "Try again, or use an email link instead." },
  "google-off": { title: "Google sign-in isn’t set up yet", text: "Use the email link for now. An admin can switch Google on in Supabase." },
};

const ROLES = [
  { icon: UserRound, title: "Citizens", text: "Send a link, message or screenshot and follow the check live." },
  { icon: ClipboardCheck, title: "Reviewers", text: "Read the evidence, decide the verdict and publish it." },
  { icon: UsersRound, title: "Admins", text: "Choose reviewers and manage the trusted sources." },
] as const;

type SearchParams = Promise<{ next?: string; error?: string }>;

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="page-enter mx-auto grid w-full max-w-7xl items-stretch gap-5 px-4 pt-6 pb-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-10">
      <BrandPanel />
      <div className="flex flex-col justify-center">
        <Suspense fallback={<Skeleton className="mx-auto h-[30rem] w-full max-w-md rounded-[2.5rem]" />}>
          <LoginContent searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

const ROLE_TONES = ["bg-tint-coral text-tint-coral-foreground", "bg-tint-sky text-tint-sky-foreground", "bg-tint-lime text-tint-lime-foreground"];

/** The left side on large screens: a dark card with the three roles. Hidden on phones. */
function BrandPanel() {
  return (
    <section className="relative hidden overflow-hidden rounded-[2.5rem] bg-tint-ink p-10 text-tint-ink-foreground lg:flex lg:min-h-[40rem] lg:flex-col xl:p-12">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="orb absolute -top-24 -right-20 size-96 rounded-full bg-brand/35 blur-[110px]" />
        <div className="orb absolute -bottom-32 -left-20 size-96 rounded-full bg-ai/30 blur-[120px] [animation-delay:-9s]" />
      </div>
      <div className="pointer-events-none absolute -right-40 -bottom-44 size-[26rem] opacity-60" aria-hidden>
        <Globe className="absolute inset-0" />
      </div>

      <p className="relative text-xs font-bold tracking-[0.2em] text-brand uppercase">Welcome</p>
      <h2 className="relative mt-4 max-w-md text-5xl leading-[1.02] font-bold tracking-tight xl:text-6xl">
        Check before <span className="text-white/45">you forward.</span>
      </h2>
      <p className="relative mt-5 max-w-sm text-lg text-white/65">AI gathers the evidence in about a minute. A trained human reviewer always makes the final call.</p>

      <ul className="relative mt-10 grid max-w-lg gap-3">
        {ROLES.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="flex items-center gap-4 rounded-[1.5rem] bg-white/[0.06] p-3.5 pr-5 ring-1 ring-white/10 backdrop-blur">
            <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${ROLE_TONES[i]}`}>
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-bold">{title}</p>
              <p className="text-sm text-white/60">{text}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="relative mt-auto max-w-[20rem] pt-10 text-xs text-white/50">
        Evidence from the Election Commission of India, PIB and IFCN-certified fact-checkers.
      </p>
    </section>
  );
}

async function LoginContent({ searchParams }: { searchParams: SearchParams }) {
  const { next = "/", error } = await searchParams;
  const errorInfo = error ? ERRORS[error] : null;

  if (!hasSupabase) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4">
        {errorInfo && <ErrorAlert {...errorInfo} />}
        <DemoLoginPanel next={next} />
      </div>
    );
  }

  return (
    <div className="glass relative mx-auto w-full max-w-md overflow-hidden rounded-[2.5rem] bg-card p-7 shadow-[0_40px_100px_-40px_rgba(10,14,12,0.5)] ring-1 ring-foreground/10 sm:p-10">
      <div className="relative">
        <Logo className="size-12" />
        <h1 className="mt-7 text-4xl leading-[1.05] font-bold tracking-tight">Sign in</h1>
        <p className="mt-2 text-muted-foreground">Submit claims and follow every check. No passwords needed.</p>

        {errorInfo && (
          <div className="mt-6">
            <ErrorAlert {...errorInfo} />
          </div>
        )}

        <form action={signInWithGoogle} className="mt-7">
          <input type="hidden" name="next" value={next} />
          <GoogleButton />
        </form>

        <div className="my-6 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or use your email
          <span className="h-px flex-1 bg-border" />
        </div>

        <MagicLinkForm next={next} />

        <div className="mt-7 space-y-2 border-t border-foreground/[0.07] pt-5 text-xs text-muted-foreground">
          <p className="flex items-start gap-2">
            <LockKeyhole className="mt-px size-3.5 shrink-0" aria-hidden />
            No passwords. We only use your name and email, and never post anything for you.
          </p>
          <p className="flex items-start gap-2">
            <UsersRound className="mt-px size-3.5 shrink-0" aria-hidden />
            Everyone signs in here. Reviewer and admin access comes with your account.
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorAlert({ title, text }: { title: string; text: string }) {
  return (
    <Alert variant="destructive" className="rounded-2xl">
      <AlertCircle aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{text}</AlertDescription>
    </Alert>
  );
}
