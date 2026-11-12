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
      <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        Nothing here. The queue is clear.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Submission</TableHead>
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
              <TableCell className="max-w-[22rem] pl-4">
                <div className="flex items-center gap-3">
                  <InputTypeIcon type={item.type} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    {item.url && <p className="truncate text-xs text-muted-foreground">{domainOf(item.url)}</p>}
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
                <Button size="sm" variant={item.status === "NEEDS_REVIEW" ? "default" : "outline"} asChild>
                  <Link href={`/review/${item.id}`}>{item.status === "NEEDS_REVIEW" ? "Review" : "Open"}</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
