"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shown when a page crashes. The rest of the site (header, footer) keeps working. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // A dropped connection while sending (for example a weak mobile signal) gets its own message.
  const offline = /fetch|network|load failed|connection/i.test(error.message ?? "");

  return (
    <main className="page-enter mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <TriangleAlert className="size-10 text-destructive" aria-hidden />
      <h1 className="text-2xl font-semibold">{offline ? "Couldn’t reach the server" : "Something went wrong"}</h1>
      <p className="text-muted-foreground">
        {offline
          ? "Your internet connection dropped while sending. Check your connection (Wi-Fi or mobile data) and try again."
          : "This page couldn’t load. Try again, and if it keeps happening, come back in a few minutes."}
      </p>
      {error.digest && <p className="text-xs text-muted-foreground">Error reference: {error.digest}</p>}
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
