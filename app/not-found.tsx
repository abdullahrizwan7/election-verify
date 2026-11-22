import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="page-enter mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <SearchX className="size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">The link may be wrong, or the submission may have been removed.</p>
      <Button asChild>
        <Link href="/verified">Browse verified claims</Link>
      </Button>
    </main>
  );
}
