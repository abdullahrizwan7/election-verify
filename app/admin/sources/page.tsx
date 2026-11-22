import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { SourceForm } from "@/components/admin/source-form";
import { TableSkeleton } from "@/components/skeletons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { listSources } from "@/lib/data";
import { SOURCE_TYPES } from "@/lib/labels";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Trusted sources" };

export default function SourcesPage() {
  return (
    <main className="page-enter mx-auto max-w-7xl space-y-8 px-4 pt-8 pb-16 sm:px-6 md:pt-12">
      <div>
        <span className="glass mb-4 inline-flex items-center gap-2 rounded-full bg-card px-3.5 py-1.5 text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase ring-1 ring-foreground/[0.07]">Admin</span>
        <h1 className="text-4xl leading-[1.02] font-bold tracking-tight sm:text-5xl md:text-6xl">
          Trusted <span className="text-muted-foreground/70">sources.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          The pipeline uses the trusted sources list to label where evidence comes from. Official and fact-checker
          sources carry the most weight.
        </p>
      </div>
      <AdminNav current="/admin/sources" />
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <SourcesManager />
      </Suspense>
    </main>
  );
}

async function SourcesManager() {
  await requireRole("ADMIN", "/admin/sources");
  const sources = await listSources();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Source</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="pr-4">Trust</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => (
              <TableRow key={source.domain}>
                <TableCell className="pl-4">
                  <p className="font-medium">{source.name}</p>
                  <p className="text-xs text-muted-foreground">{source.domain}</p>
                  {source.notes && <p className="mt-1 max-w-sm text-xs whitespace-normal text-muted-foreground">{source.notes}</p>}
                </TableCell>
                <TableCell>
                  <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", SOURCE_TYPES[source.type].className)}>
                    {SOURCE_TYPES[source.type].label}
                  </span>
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          source.trust >= 70 ? "bg-emerald-500" : source.trust >= 40 ? "bg-amber-500" : "bg-red-500",
                        )}
                        style={{ width: `${source.trust}%` }}
                      />
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">{source.trust}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Card className="lg:self-start">
        <CardHeader>
          <CardTitle className="text-base">Add or update a source</CardTitle>
          <CardDescription>Saving a domain that already exists updates it.</CardDescription>
        </CardHeader>
        <CardContent>
          <SourceForm />
        </CardContent>
      </Card>
    </div>
  );
}
