"use client";

import Link from "next/link";
import { Menu, ShieldCheck } from "lucide-react";
import { NAV_LINKS } from "@/components/layout/nav-links";
import { T } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const EXTRA_LINKS = [
  { href: "/submit", label: "Submit a claim" },
  { href: "/my", label: "My submissions" },
  { href: "/review", label: "Reviewer dashboard" },
];

/** The menu button shown on phones, where the header links don't fit. */
export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" aria-hidden /> ElectionVerify
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4" aria-label="Menu">
          {[...NAV_LINKS, ...EXTRA_LINKS].map((link) => (
            <SheetClose asChild key={link.href}>
              <Link href={link.href} className="rounded-lg px-3 py-2.5 text-sm hover:bg-muted">
                {"key" in link ? <T k={link.key} /> : link.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
