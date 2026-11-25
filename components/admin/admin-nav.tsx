import Link from "next/link";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/users", label: "People and roles" },
  { href: "/admin/sources", label: "Trusted sources" },
  { href: "/review/analytics", label: "Analytics" },
  { href: "/admin/activity", label: "Activity log" },
  { href: "/admin/setup", label: "Setup" },
];

export function AdminNav({ current }: { current: string }) {
  return (
    <nav className="glass no-scrollbar flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-card p-1 ring-1 ring-foreground/[0.07]" aria-label="Admin">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={current === link.href ? "page" : undefined}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
            current === link.href
              ? "bg-foreground text-background shadow-[0_6px_16px_-6px_rgba(0,0,0,0.45)]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
