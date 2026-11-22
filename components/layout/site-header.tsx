import Link from "next/link";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { CommandPalette } from "@/components/command-palette";
import { HeaderAccount } from "@/components/layout/header-account";
import { LanguageSwitcher, T } from "@/components/i18n";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NAV_LINKS } from "@/components/layout/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { CtaButton } from "@/components/ui/cta-button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * A floating pill navigation bar (Cognify-inspired): logo on the left, links in
 * the middle, tools and the main call-to-action on the right.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 rounded-full border bg-background/70 py-1.5 pr-1.5 pl-2 shadow-[0_10px_40px_-18px_rgba(0,0,0,0.55)] backdrop-blur-xl md:gap-4 md:pl-3">
        <MobileNav />
        <Link href="/" className="flex items-center gap-2.5 rounded-full pr-2 font-semibold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-brand">
            <ShieldCheck className="size-[18px]" aria-hidden />
          </span>
          <span className="hidden text-[17px] min-[400px]:inline">ElectionVerify</span>
        </Link>

        <nav className="mx-auto hidden items-center gap-1 text-sm md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <T k={link.key} />
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <CommandPalette />
          <LanguageSwitcher />
          <ThemeToggle />
          {/* Reads the login cookie, so it loads separately from the rest of the page. */}
          <Suspense fallback={<Skeleton className="h-9 w-16 rounded-full" />}>
            <HeaderAccount />
          </Suspense>
          {/* On small phones this lives in the menu instead, so the header fits. */}
          <CtaButton href="/submit" size="sm" className="ml-1 hidden min-[480px]:inline-flex">
            <T k="nav.submit" />
          </CtaButton>
        </div>
      </div>
    </header>
  );
}
