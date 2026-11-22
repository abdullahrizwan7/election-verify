import Link from "next/link";
import { InputTypeIcon } from "@/components/input-type-icon";
import { ConfidenceMeter } from "@/components/review/confidence-meter";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VerdictBadge } from "@/components/verdict-badge";
import { domainOf, timeAgo } from "@/lib/format";
import type { SubmissionSummary } from "@/lib/types";

export function ReviewQueueTable({ items }: { items: SubmissionSummary[] }) {
  if (items.length === 0) {
    return (
      <p className="glass rounded-[2rem] border border-dashed border-foreground/15 bg-card/50 p-14 text-center text-muted-foreground">
        Nothing here. The queue is clear.
      </p>
    );
  }

  return (
    <div className="glass overflow-hidden rounded-[2rem] bg-card p-1.5 ring-1 ring-foreground/[0.07]" data-tour="queue">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5">Submission</TableHead>
            <TableHead className="hidden md:table-cell">Submitted</TableHead>
            <TableHead>AI suggestion</TableHead>
            <TableHead className="hidden sm:table-cell">Status</TableHead>
            <TableHead className="pr-4 text-right">
              <span className="sr-only">Action</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="max-w-[22rem] py-3.5 pl-5">
                <div className="flex items-center gap-3">
                  <InputTypeIcon type={item.type} className="size-10 rounded-2xl bg-foreground/[0.06]" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{item.title}</p>
                    <p className="flex gap-2 truncate text-xs text-muted-foreground">
                      {item.url && <span className="truncate">{domainOf(item.url)}</span>}
                      {item.reportCount > 1 && (
                        <span className="shrink-0 font-medium text-amber-700 dark:text-amber-300">
                          Reported {item.reportCount}×
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">{timeAgo(item.createdAt)}</TableCell>
              <TableCell>
                {item.aiVerdict ? (
                  <div className="flex flex-col items-start gap-1">
                    <VerdictBadge verdict={item.aiVerdict} />
                    <ConfidenceMeter value={item.aiConfidence} />
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Not ready yet</span>
                )}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <StatusBadge status={item.status} />
              </TableCell>
              <TableCell className="pr-4 text-right">
                <Button size="sm" variant={item.status === "NEEDS_REVIEW" ? "brand" : "outline"} className="h-9 rounded-full px-4" asChild>
                  <Link href={`/review/${item.id}`} data-queue-link>
                    {item.status === "NEEDS_REVIEW" ? "Review" : "Open"}
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
