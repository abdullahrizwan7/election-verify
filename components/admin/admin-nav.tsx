import Link from "next/link";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/sources", label: "Trusted sources" },
  { href: "/review/analytics", label: "Analytics" },
  { href: "/admin/activity", label: "Activity log" },
  { href: "/admin/setup", label: "Setup" },
];

export function AdminNav({ current }: { current: string }) {
  return (
    <nav className="flex flex-wrap gap-1 border-b" aria-label="Admin">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={current === link.href ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm transition",
            current === link.href
              ? "border-primary font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
