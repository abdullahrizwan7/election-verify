import Link from "next/link";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { getCurrentUser, hasRole } from "@/lib/auth";

export async function HeaderAccount() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Button variant="ghost" size="sm" asChild className="rounded-full px-3.5">
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  return (
    <>
      {hasRole(user, "REVIEWER") && (
        <Button variant="ghost" size="sm" asChild className="hidden rounded-full px-3.5 lg:inline-flex">
          <Link href="/review">Review queue</Link>
        </Button>
      )}
      <UserMenu user={user} isAdmin={hasRole(user, "ADMIN")} />
    </>
  );
}
