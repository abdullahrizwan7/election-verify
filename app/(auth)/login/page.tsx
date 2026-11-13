import type { Metadata } from "next";
import { Suspense } from "react";
import { AlertCircle } from "lucide-react";
import { DemoLoginPanel } from "@/components/auth/demo-login-panel";
import { MagicLinkForm } from "@/components/auth/magic-link-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { signInWithGoogle } from "@/app/(auth)/actions";
import { hasSupabase } from "@/lib/config";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, { title: string; text: string }> = {
  forbidden: { title: "You don't have access to that page", text: "Sign in with a reviewer or admin account to continue." },
  link: { title: "That sign-in link didn't work", text: "It may have expired. Ask for a new link below." },
  oauth: { title: "Google sign-in failed", text: "Try again, or use an email link instead." },
};

type SearchParams = Promise<{ next?: string; error?: string }>;

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-14">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function LoginContent({ searchParams }: { searchParams: SearchParams }) {
  const { next = "/", error } = await searchParams;
  const errorInfo = error ? ERRORS[error] : null;

  return (
    <>
      {errorInfo && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden />
          <AlertTitle>{errorInfo.title}</AlertTitle>
          <AlertDescription>{errorInfo.text}</AlertDescription>
        </Alert>
      )}

      {hasSupabase ? (
        <Card className="glow">
          <CardHeader>
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>We’ll email you a link. No password needed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <MagicLinkForm next={next} />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Separator className="flex-1" /> or <Separator className="flex-1" />
            </div>
            <form action={signInWithGoogle}>
              <input type="hidden" name="next" value={next} />
              <Button type="submit" variant="outline" className="w-full">
                Continue with Google
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <DemoLoginPanel next={next} />
      )}
    </>
  );
}
