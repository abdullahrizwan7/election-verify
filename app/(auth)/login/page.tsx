import type { Metadata } from "next";
import { Suspense } from "react";
import { AlertCircle, ClipboardCheck, LockKeyhole, ShieldCheck, UserRound, UsersRound } from "lucide-react";
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
    <main className="mx-auto grid w-full max-w-6xl items-stretch gap-6 px-4 py-8 sm:py-12 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
      <BrandPanel />
      <div className="flex flex-col justify-center">
        <Suspense fallback={<Skeleton className="mx-auto h-[30rem] w-full max-w-md rounded-3xl" />}>
          <LoginContent searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

/** The left side on large screens: what ElectionVerify is and who signs in. Hidden on phones. */
function BrandPanel() {
  return (
    <section className="border-gradient relative hidden overflow-hidden rounded-3xl p-10 lg:flex lg:min-h-[36rem] lg:flex-col">
      <div className="bg-grid absolute inset-0 -z-10 opacity-60" aria-hidden />
      <div className="pointer-events-none absolute -right-44 -bottom-48 size-[26rem] opacity-80" aria-hidden>
        <div className="absolute inset-[10%] rounded-full bg-glow/25 blur-3xl" />
        <Globe className="absolute inset-0" />
      </div>

      <div className="flex items-center gap-2.5">
        <span className="grid size-10 place-items-center rounded-xl bg-glow/15 text-glow ring-1 ring-glow/30">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <span className="text-lg font-semibold tracking-tight">ElectionVerify</span>
      </div>

      <h2 className="mt-10 max-w-md text-4xl leading-tight font-semibold tracking-tight">
        Check before <span className="text-gradient">you forward.</span>
      </h2>
      <p className="mt-4 max-w-sm text-muted-foreground">
        AI gathers the evidence in about a minute. A trained human reviewer always makes the final call.
      </p>

      <ul className="relative mt-10 max-w-[21rem] space-y-5">
        {ROLES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg border bg-background/60 backdrop-blur">
              <Icon className="size-4 text-glow" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="relative mt-auto max-w-[18rem] pt-10 text-xs text-muted-foreground">
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
    <div className="glow relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border bg-card/80 p-7 backdrop-blur-xl sm:p-9">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-glow/20 blur-3xl" aria-hidden />

      <div className="relative">
        <span className="grid size-12 place-items-center rounded-2xl bg-glow/15 text-glow ring-1 ring-glow/30 lg:hidden">
          <ShieldCheck className="size-6" aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight lg:mt-0">Welcome to ElectionVerify</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Sign in to submit claims and follow every check.</p>

        {errorInfo && (
          <div className="mt-6">
            <ErrorAlert {...errorInfo} />
          </div>
        )}

        <form action={signInWithGoogle} className="mt-7">
          <input type="hidden" name="next" value={next} />
          <GoogleButton />
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or use your email
          <span className="h-px flex-1 bg-border" />
        </div>

        <MagicLinkForm next={next} />

        <div className="mt-7 space-y-2 border-t pt-5 text-xs text-muted-foreground">
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
    <Alert variant="destructive" className="rounded-xl">
      <AlertCircle aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{text}</AlertDescription>
    </Alert>
  );
}
