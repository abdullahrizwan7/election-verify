import Link from "next/link";
import { Suspense } from "react";
import { CommandPalette } from "@/components/command-palette";
import { HeaderAccount } from "@/components/layout/header-account";
import { HeaderShell } from "@/components/layout/header-shell";
import { Logo } from "@/components/layout/logo";
import { PillNav } from "@/components/layout/pill-nav";
import { LanguageSwitcher } from "@/components/i18n";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Three floating "islands" over the page: the logo, the pill navigation in the
 * middle and a tools pill (search, language, theme, account) on the right.
 * On phones the navigation wraps onto its own row.
 */
export function SiteHeader() {
  return (
    <HeaderShell>
      <Link
        href="/"
        className="group glass flex items-center gap-2.5 justify-self-start rounded-full bg-card py-1 pr-4 pl-1 ring-1 ring-foreground/[0.07]"
        aria-label="ElectionVerify home"
      >
        <Logo className="size-9 transition-transform duration-500 ease-(--ease-pop) group-hover:scale-105 group-hover:-rotate-8" />
        <span className="text-[17px] font-bold tracking-tight">ElectionVerify</span>
      </Link>

      <div className="hidden md:block">
        <PillNav />
      </div>

      <div className="glass flex items-center gap-0.5 justify-self-end rounded-full bg-card p-1 ring-1 ring-foreground/[0.07]">
        <CommandPalette />
        <LanguageSwitcher />
        <ThemeToggle />
        {/* Reads the login cookie, so it loads separately from the rest of the page. */}
        <Suspense fallback={<Skeleton className="h-9 w-20 rounded-full" />}>
          <HeaderAccount />
        </Suspense>
      </div>

      <div className="order-last flex w-full justify-center md:hidden">
        <PillNav />
      </div>
    </HeaderShell>
  );
}
