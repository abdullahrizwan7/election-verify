import Link from "next/link";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { CommandPalette } from "@/components/command-palette";
import { HeaderAccount } from "@/components/layout/header-account";
import { LanguageSwitcher, T } from "@/components/i18n";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NAV_LINKS } from "@/components/layout/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 md:gap-6">
        <MobileNav />
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" aria-hidden />
          </span>
          <span className="hidden min-[400px]:inline">ElectionVerify</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild>
              <Link href={link.href}>
                <T k={link.key} />
              </Link>
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <CommandPalette />
          <LanguageSwitcher />
          <ThemeToggle />
          {/* On small phones this lives in the menu instead, so the header fits. */}
          <Button size="sm" className="hidden min-[400px]:inline-flex" asChild>
            <Link href="/submit">
              <T k="nav.submit" />
            </Link>
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
