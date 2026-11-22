import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { TableSkeleton } from "@/components/skeletons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { listActivity } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { ACTIONS, VERDICTS } from "@/lib/labels";
import type { ActivityEntry, Verdict } from "@/lib/types";

export const metadata: Metadata = { title: "Activity log" };

export default function ActivityPage() {
  return (
    <main className="page-enter mx-auto max-w-7xl space-y-8 px-4 pt-8 pb-16 sm:px-6 md:pt-12">
      <div>
        <span className="glass mb-4 inline-flex items-center gap-2 rounded-full bg-card px-3.5 py-1.5 text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase ring-1 ring-foreground/[0.07]">Admin</span>
        <h1 className="text-4xl leading-[1.02] font-bold tracking-tight sm:text-5xl md:text-6xl">
          Activity <span className="text-muted-foreground/70">log.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">Every important action is recorded here and never edited.</p>
      </div>
      <AdminNav current="/admin/activity" />
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <ActivityTable />
      </Suspense>
    </main>
  );
}

function details(entry: ActivityEntry): string {
  const meta = entry.meta ?? {};
  if (entry.action === "review.published" && typeof meta.verdict === "string") {
    const verdict = VERDICTS[meta.verdict as Verdict]?.label ?? meta.verdict;
    const ai = typeof meta.aiVerdict === "string" ? VERDICTS[meta.aiVerdict as Verdict]?.label : null;
    return ai && ai !== verdict ? `${verdict} (AI suggested ${ai})` : verdict;
  }
  if (typeof meta.domain === "string") return meta.domain;
  if (typeof meta.type === "string") return meta.type.toLowerCase();
  return "";
}

async function ActivityTable() {
  await requireRole("ADMIN", "/admin/activity");
  const entries = await listActivity(200);

  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        Nothing yet. Submit an item or publish a verdict and it will appear here.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">When</TableHead>
            <TableHead>Who</TableHead>
            <TableHead>What</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="pr-4">Item</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="pl-4 text-muted-foreground">{formatDateTime(entry.createdAt)}</TableCell>
              <TableCell>{entry.actorName ?? "Anonymous"}</TableCell>
              <TableCell className="font-medium">{ACTIONS[entry.action] ?? entry.action}</TableCell>
              <TableCell className="text-muted-foreground">{details(entry)}</TableCell>
              <TableCell className="pr-4">
                {entry.submissionId && (
                  <Link href={`/review/${entry.submissionId}`} className="text-primary hover:underline">
                    Open
                  </Link>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
