import Link from "next/link";
import { FolderGit2, Mail } from "lucide-react";
import { T } from "@/components/i18n";
import { Logo } from "@/components/layout/logo";
import type { MessageKey } from "@/lib/i18n/dictionaries";

const linkClass = "inline-block text-muted-foreground transition-[color,transform] duration-300 hover:translate-x-1 hover:text-foreground";

const COLUMNS = [
  {
    title: "footer.explore",
    links: [
      { href: "/verified", key: "nav.verified" },
      { href: "/submit", key: "nav.submit" },
      { href: "/about", key: "nav.method" },
      { href: "/#ratings", key: "ratings.title" },
    ],
  },
  {
    title: "footer.workspace",
    links: [
      { href: "/review", key: "footer.reviewQueue" },
      { href: "/review/analytics", key: "footer.analytics" },
      { href: "/admin/sources", key: "footer.sources" },
      { href: "/my", key: "footer.mine" },
    ],
  },
] as const satisfies readonly { title: MessageKey; links: readonly { href: string; key: MessageKey }[] }[];

const BADGES = [
  { key: "footer.badgeHuman", tone: "bg-tint-lime text-tint-lime-foreground" },
  { key: "footer.badgeFree", tone: "bg-tint-sky text-tint-sky-foreground" },
  { key: "features.languages.title", tone: "bg-tint-coral text-tint-coral-foreground" },
] as const;

/** A big rounded card at the bottom of every page. */
export function SiteFooter() {
  return (
    <footer className="mt-auto px-3 pt-10 pb-24 sm:px-4 md:pb-4">
      <div className="glass mx-auto max-w-7xl rounded-[2.5rem] bg-card px-6 py-12 ring-1 ring-foreground/[0.08] sm:px-10 md:py-14">
        <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-16">
          <div className="lg:col-span-2">
            <Link href="/" className="group mb-6 flex w-fit items-center gap-3">
              <Logo className="size-10 transition-transform duration-500 ease-(--ease-pop) group-hover:scale-105 group-hover:-rotate-8" />
              <span className="text-xl font-bold tracking-tight">ElectionVerify</span>
            </Link>
            <p className="mb-7 max-w-sm text-lg leading-relaxed text-muted-foreground">
              <T k="footer.about" />
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {BADGES.map((badge) => (
                <span key={badge.key} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${badge.tone}`}>
                  <T k={badge.key} />
                </span>
              ))}
            </div>
          </div>
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h4 className="mb-6 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                <T k={column.title} />
              </h4>
              <ul className="space-y-3.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClass}>
                      <T k={link.key} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-foreground/[0.08] pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2026 ElectionVerify · <T k="footer.bottom" />
          </p>
          <div className="flex items-center gap-2">
            {[
              { href: "https://github.com/abdullahrizwan7/election-verify", label: "Source code on GitHub", Icon: FolderGit2 },
              { href: "/about", label: "Contact", Icon: Mail },
            ].map(({ href, label, Icon }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="flex size-10 items-center justify-center rounded-full bg-foreground/[0.06] transition-all duration-300 ease-(--ease-pop) hover:-translate-y-1 hover:scale-110 hover:bg-brand hover:text-brand-foreground"
              >
                <Icon className="size-[17px]" aria-hidden />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
