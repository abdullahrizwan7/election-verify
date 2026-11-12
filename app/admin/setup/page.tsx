import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckCircle2, CircleDashed, ExternalLink } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { TableSkeleton } from "@/components/skeletons";
import { requireRole } from "@/lib/auth";
import { adminEmails, hasDatabase, hasImageStorage, hasSupabase, services } from "@/lib/config";

export const metadata: Metadata = { title: "Setup" };

export default function SetupPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-muted-foreground">
          Which free services are connected. Every service is optional: the app works without it and gets more
          complete with it. Keys go in the <code className="rounded bg-muted px-1">.env</code> file and are never shown
          here.
        </p>
      </div>
      <AdminNav current="/admin/setup" />
      <Suspense fallback={<TableSkeleton rows={7} />}>
        <ServiceList />
      </Suspense>
    </main>
  );
}

async function ServiceList() {
  await requireRole("ADMIN", "/admin/setup");

  const items = [
    {
      name: "Database (PostgreSQL)",
      connected: hasDatabase,
      env: "DATABASE_URL",
      enables: "Keeps submissions and verdicts after a restart. Without it, data lives in memory.",
      link: "https://supabase.com/dashboard",
    },
    {
      name: "Login (Supabase Auth)",
      connected: hasSupabase,
      env: "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      enables: "Real sign-in with an email link or Google. Without it, the demo accounts are used.",
      link: "https://supabase.com/dashboard",
    },
    {
      name: "Image storage (Supabase Storage)",
      connected: hasImageStorage,
      env: "SUPABASE_SECRET_KEY",
      enables: "Stores uploaded images privately and enables one-click reverse image search.",
      link: "https://supabase.com/dashboard",
    },
    {
      name: "AI (Google Gemini, free tier)",
      connected: Boolean(services.gemini.apiKey),
      env: "GEMINI_API_KEY",
      enables: "Better claim finding, image descriptions, and the AI verdict suggestion with citations.",
      link: "https://aistudio.google.com/apikey",
    },
    {
      name: "Fact-check search (Google Fact Check Tools)",
      connected: Boolean(services.factCheck.apiKey),
      env: "GOOGLE_FACT_CHECK_API_KEY",
      enables: "Finds fact-checks that news organizations already published about the same claim.",
      link: "https://console.cloud.google.com/apis/library/factchecktools.googleapis.com",
    },
    {
      name: "Web search (Tavily, free credits)",
      connected: Boolean(services.tavily.apiKey),
      env: "TAVILY_API_KEY",
      enables: "Finds news articles and official pages that support or contradict each claim.",
      link: "https://app.tavily.com",
    },
    {
      name: "Background jobs (Inngest)",
      connected: services.inngest.enabled,
      env: "INNGEST_DEV=1 locally, or INNGEST_EVENT_KEY + INNGEST_SIGNING_KEY",
      enables: "Runs the checks as a reliable background job with retries. Without it, they run inside the web server.",
      link: "https://www.inngest.com",
    },
    {
      name: "Admin emails",
      connected: adminEmails.length > 0,
      env: "ADMIN_EMAILS",
      enables: "People with these emails become admins the first time they sign in.",
      link: null,
    },
  ];

  const connected = items.filter((i) => i.connected).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{connected}</span> of {items.length} connected
      </p>
      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <li key={item.name} className="flex gap-3 rounded-xl border bg-card p-4">
            {item.connected ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-label="Connected" />
            ) : (
              <CircleDashed className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-label="Not connected" />
            )}
            <div className="min-w-0 space-y-1">
              <p className="font-medium">
                {item.name}{" "}
                <span className={item.connected ? "text-xs text-emerald-700 dark:text-emerald-300" : "text-xs text-muted-foreground"}>
                  {item.connected ? "Connected" : "Not connected"}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">{item.enables}</p>
              <p className="text-xs text-muted-foreground">
                <code className="rounded bg-muted px-1 break-all">{item.env}</code>
              </p>
              {item.link && !item.connected && (
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  Get a free key <ExternalLink className="size-3" aria-hidden />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
