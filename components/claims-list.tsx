import type { Claim } from "@/lib/types";

export function ClaimsList({ claims }: { claims: Claim[] }) {
  if (claims.length === 0) {
    return <p className="text-sm text-muted-foreground">No claims have been found yet.</p>;
  }
  return (
    <ol className="space-y-2">
      {claims.map((claim, index) => (
        <li key={claim.id} className="flex gap-3 rounded-lg border p-3 text-sm">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {index + 1}
          </span>
          <span className="pt-0.5">{claim.text}</span>
        </li>
      ))}
    </ol>
  );
}
