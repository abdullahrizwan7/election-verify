import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2, LogIn } from "lucide-react";
import { SubmitForm } from "@/components/submit/submit-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Submit a claim" };

const TIPS = [
  "Send the original link, not a link to a screenshot of it.",
  "Paste forwarded messages exactly as you got them.",
  "Screenshots are fine. We read the text inside images.",
  "One claim per submission gives the clearest answer.",
];

export default function SubmitPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Submit a claim</h1>
          <p className="mt-1 text-muted-foreground">
            Not sure if something about the election is true? Send it to us and we’ll check it.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
              <SubmitGate />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tips for a quick answer</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {TIPS.map((tip) => (
                <li key={tip} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What happens next</CardTitle>
            <CardDescription>
              Our system collects evidence in about a minute. Then a human reviewer checks it and publishes the
              verdict. You can follow every step on the result page.
            </CardDescription>
          </CardHeader>
        </Card>
      </aside>
    </main>
  );
}

/** Shows the form to signed-in people, and a sign-in prompt to everyone else. */
async function SubmitGate() {
  const user = await getCurrentUser();
  if (user) return <SubmitForm />;

  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <LogIn className="size-5" aria-hidden />
      </span>
      <h2 className="text-lg font-medium">Sign in to submit</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Signing in helps us stop spam and lets you follow the progress of what you send.
      </p>
      <Button asChild>
        <Link href="/login?next=/submit">Sign in</Link>
      </Button>
    </div>
  );
}
