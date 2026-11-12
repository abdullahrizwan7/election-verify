import Link from "next/link";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { getCurrentUser, hasRole } from "@/lib/auth";

export async function HeaderAccount() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  return (
    <>
      {hasRole(user, "REVIEWER") && (
        <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
          <Link href="/review">Review queue</Link>
        </Button>
      )}
      <UserMenu user={user} isAdmin={hasRole(user, "ADMIN")} />
    </>
  );
}
