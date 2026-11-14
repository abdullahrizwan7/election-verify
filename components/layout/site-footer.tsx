import Link from "next/link";
import { T } from "@/components/i18n";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-muted-foreground md:grid-cols-[2fr_1fr_1fr]">
        <div className="space-y-2">
          <p className="font-medium text-foreground">ElectionVerify</p>
          <p className="max-w-md">
            <T k="footer.about" />
          </p>
        </div>
        <div className="space-y-2">
          <p className="font-medium text-foreground">Explore</p>
          <ul className="space-y-1">
            <li><Link className="hover:text-foreground" href="/verified">Verified claims</Link></li>
            <li><Link className="hover:text-foreground" href="/submit">Submit a claim</Link></li>
            <li><Link className="hover:text-foreground" href="/about">Our method</Link></li>
            <li><Link className="hover:text-foreground" href="/#ratings">How we rate claims</Link></li>
          </ul>
        </div>
        <div className="space-y-2">
          <p className="font-medium text-foreground">Team</p>
          <ul className="space-y-1">
            <li><Link className="hover:text-foreground" href="/review">Reviewer dashboard</Link></li>
            <li><Link className="hover:text-foreground" href="/admin/sources">Trusted sources</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
