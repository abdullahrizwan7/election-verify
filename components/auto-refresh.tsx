"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Asks the server for fresh data every few seconds while a submission is
 * being processed, so the progress list updates without a page reload.
 */
export function AutoRefresh({ seconds = 4 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);

  return null;
}
