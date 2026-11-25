import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { RoleForm } from "@/components/admin/role-form";
import { TableSkeleton } from "@/components/skeletons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { listProfiles } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "People and roles" };

export default function UsersPage() {
  return (
    <main className="page-enter mx-auto max-w-7xl space-y-8 px-4 pt-8 pb-16 sm:px-6 md:pt-12">
      <div>
        <span className="glass mb-4 inline-flex items-center gap-2 rounded-full bg-card px-3.5 py-1.5 text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase ring-1 ring-foreground/[0.07]">
          Admin
        </span>
        <h1 className="text-4xl leading-[1.02] font-bold tracking-tight sm:text-5xl md:text-6xl">
          People <span className="text-muted-foreground/70">and roles.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          Everyone who has signed in at least once. Make trained fact-checkers Reviewers; Admins can also manage sources and roles.
          Every change is recorded in the activity log.
        </p>
      </div>
      <AdminNav current="/admin/users" />
      <Suspense fallback={<TableSkeleton rows={6} />}>
        <PeopleTable />
      </Suspense>
    </main>
  );
}

async function PeopleTable() {
  const admin = await requireRole("ADMIN", "/admin/users");
  const people = await listProfiles();

  if (people.length === 0) {
    return <p className="text-muted-foreground">Nobody has signed in yet.</p>;
  }

  return (
    <div className="glass overflow-hidden rounded-[2rem] bg-card p-1.5 ring-1 ring-foreground/[0.07]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5">Person</TableHead>
            <TableHead className="hidden md:table-cell">Joined</TableHead>
            <TableHead className="hidden sm:table-cell">Claims sent</TableHead>
            <TableHead className="pr-5">Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {people.map((person) => (
            <TableRow key={person.id}>
              <TableCell className="max-w-[16rem] py-3.5 pl-5">
                <p className="truncate font-semibold">{person.name ?? "No name"}</p>
                <p className="truncate text-xs text-muted-foreground">{person.email}</p>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {person.createdAt.getTime() > 0 ? formatDate(person.createdAt) : "Demo account"}
              </TableCell>
              <TableCell className="hidden tabular-nums sm:table-cell">{person.submissionCount}</TableCell>
              <TableCell className="pr-5">
                <RoleForm userId={person.id} role={person.role} isSelf={person.id === admin.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
