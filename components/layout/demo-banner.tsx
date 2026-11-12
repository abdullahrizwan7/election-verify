import { hasDatabase, hasSupabase } from "@/lib/config";

/** A thin bar that explains which parts are running on sample data. */
export function DemoBanner() {
  if (hasDatabase && hasSupabase) return null;

  const parts = [!hasDatabase && "sample data kept in memory", !hasSupabase && "demo sign-in"].filter(Boolean);

  return (
    <div className="border-b bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
      <p className="mx-auto max-w-6xl px-4 py-1.5 text-center text-xs">
        <span className="font-semibold">Demo mode:</span> {parts.join(" and ")}. Add the keys from{" "}
        <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">.env.example</code> to connect the real services.
      </p>
    </div>
  );
}
