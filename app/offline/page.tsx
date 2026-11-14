import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = { title: "You're offline" };

/** Shown by the service worker when there is no internet connection. */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <WifiOff className="size-10 text-glow" aria-hidden />
      <h1 className="text-2xl font-semibold">You’re offline</h1>
      <p className="text-muted-foreground">
        Connect to the internet to check claims and see the latest verdicts. Until then, think twice before forwarding
        anything about the election.
      </p>
    </main>
  );
}
