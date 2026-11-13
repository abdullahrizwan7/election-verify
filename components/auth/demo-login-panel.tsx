import { ClipboardCheck, Database, UserRound } from "lucide-react";
import { demoSignIn } from "@/app/(auth)/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ACCOUNTS = [
  {
    role: "citizen",
    title: "Citizen",
    text: "Submit links, messages and images, and follow their progress.",
    icon: UserRound,
  },
  {
    role: "reviewer",
    title: "Reviewer",
    text: "Read the AI's evidence, decide the verdict and publish it.",
    icon: ClipboardCheck,
  },
  {
    role: "admin",
    title: "Admin",
    text: "Everything a reviewer can do, plus manage trusted sources.",
    icon: Database,
  },
] as const;

/** Shown instead of real login while Supabase keys are not set. */
export function DemoLoginPanel({ next }: { next: string }) {
  return (
    <Card className="glow">
      <CardHeader>
        <CardTitle className="text-xl">Choose a demo account</CardTitle>
        <CardDescription>
          Real email and Google sign-in switch on when Supabase keys are added. For now, pick a role to explore.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {ACCOUNTS.map(({ role, title, text, icon: Icon }) => (
          <form key={role} action={demoSignIn}>
            <input type="hidden" name="role" value={role} />
            <input type="hidden" name="next" value={next} />
            <button
              type="submit"
              className="flex w-full items-start gap-3 rounded-lg border bg-card/50 p-3 text-left transition hover:border-glow/50 hover:bg-glow/10 hover:shadow-[0_0_24px_-8px] hover:shadow-glow/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-glow/20 to-glow-2/20 text-glow ring-1 ring-glow/25">
                <Icon className="size-4" aria-hidden />
              </span>
              <span>
                <span className="block font-medium">Continue as {title}</span>
                <span className="block text-sm text-muted-foreground">{text}</span>
              </span>
            </button>
          </form>
        ))}
      </CardContent>
    </Card>
  );
}
