import Link from "next/link";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { getCurrentUser, hasRole } from "@/lib/auth";

export async function HeaderAccount() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Button size="sm" asChild className="ml-0.5 h-9 rounded-full px-4">
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  return (
    <>
      {hasRole(user, "REVIEWER") && (
        <Button size="sm" asChild className="mx-0.5 hidden h-9 rounded-full px-4 lg:inline-flex">
          <Link href="/review">Workspace</Link>
        </Button>
      )}
      <UserMenu user={user} isAdmin={hasRole(user, "ADMIN")} />
    </>
  );
}
