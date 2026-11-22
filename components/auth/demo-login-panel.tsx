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

const TONES = {
  citizen: "bg-tint-coral text-tint-coral-foreground",
  reviewer: "bg-tint-sky text-tint-sky-foreground",
  admin: "bg-tint-lime text-tint-lime-foreground",
} as const;

/** Shown instead of real login while Supabase keys are not set. */
export function DemoLoginPanel({ next }: { next: string }) {
  return (
    <Card className="rounded-[2.5rem] py-7 shadow-[0_40px_100px_-40px_rgba(10,14,12,0.5)]">
      <CardHeader>
        <CardTitle className="text-3xl">Choose a demo account</CardTitle>
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
              className="group flex w-full items-center gap-3.5 rounded-[1.5rem] bg-foreground/[0.04] p-3.5 text-left transition duration-300 hover:-translate-y-0.5 hover:bg-foreground/[0.07] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-500 ease-(--ease-pop) group-hover:-rotate-6 ${TONES[role]}`}>
                <Icon className="size-4" aria-hidden />
              </span>
              <span>
                <span className="block font-bold">Continue as {title}</span>
                <span className="block text-sm text-muted-foreground">{text}</span>
              </span>
            </button>
          </form>
        ))}
      </CardContent>
    </Card>
  );
}
