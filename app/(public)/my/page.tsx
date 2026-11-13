import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Inbox } from "lucide-react";
import { InputTypeIcon } from "@/components/input-type-icon";
import { TableSkeleton } from "@/components/skeletons";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { VerdictBadge } from "@/components/verdict-badge";
import { requireUser } from "@/lib/auth";
import { listByUser } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "My submissions" };

export default function MySubmissionsPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            <span className="text-gradient">My submissions</span>
          </h1>
          <p className="mt-1 text-muted-foreground">Everything you sent us, and where each one is.</p>
        </div>
        <Button asChild>
          <Link href="/submit">Submit another</Link>
        </Button>
      </div>
      <Suspense fallback={<TableSkeleton />}>
        <MyList />
      </Suspense>
    </main>
  );
}

async function MyList() {
  const user = await requireUser("/my");
  const items = await listByUser(user.id);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
        <Inbox className="size-8 text-muted-foreground" aria-hidden />
        <p className="font-medium">You haven’t sent anything yet</p>
        <p className="text-sm text-muted-foreground">When something about the election seems doubtful, send it to us.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {items.map((item) => (
        <li key={item.id}>
          <Link href={`/s/${item.id}`} className="flex items-center gap-3 p-4 transition hover:bg-muted/40">
            <InputTypeIcon type={item.type} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">Sent {formatDateTime(item.createdAt)}</p>
            </div>
            {item.finalVerdict ? <VerdictBadge verdict={item.finalVerdict} /> : <StatusBadge status={item.status} />}
          </Link>
        </li>
      ))}
    </ul>
  );
}
