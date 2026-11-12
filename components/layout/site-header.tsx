import Link from "next/link";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { HeaderAccount } from "@/components/layout/header-account";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" aria-hidden />
          </span>
          ElectionVerify
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex" aria-label="Main">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/verified">Verified claims</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/#how-it-works">How it works</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/#ratings">Our ratings</Link>
          </Button>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" asChild>
            <Link href="/submit">Submit a claim</Link>
          </Button>
          {/* Reads the login cookie, so it loads separately from the rest of the page. */}
          <Suspense fallback={<Skeleton className="h-8 w-20 rounded-lg" />}>
            <HeaderAccount />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
