import { VERDICT_ORDER, VERDICTS } from "@/lib/labels";
import type { Analytics } from "@/lib/analytics";

/**
 * A grid of "AI suggested X, reviewer chose Y". Darker blue means more items.
 * The diagonal (outlined) is where the reviewer agreed with the AI.
 * Every cell also shows its number, so color is never the only clue.
 */
export function AgreementMatrix({ matrix }: { matrix: Analytics["matrix"] }) {
  const max = Math.max(1, ...matrix.map((m) => m.count));
  const cell = (ai: string, final: string) => matrix.find((m) => m.ai === ai && m.final === final)?.count ?? 0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-separate border-spacing-1 text-xs">
        <caption className="sr-only">AI suggestion compared with the reviewer’s final verdict</caption>
        <thead>
          <tr>
            <th className="p-1 text-left font-medium text-muted-foreground">AI ↓ · Reviewer →</th>
            {VERDICT_ORDER.map((v) => (
              <th key={v} scope="col" className="p-1 font-medium text-muted-foreground">
                {VERDICTS[v].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VERDICT_ORDER.map((ai) => (
            <tr key={ai}>
              <th scope="row" className="p-1 text-left font-medium text-muted-foreground">
                {VERDICTS[ai].label}
              </th>
              {VERDICT_ORDER.map((final) => {
                const count = cell(ai, final);
                // One hue, light to dark: the share of the busiest cell.
                const alpha = count === 0 ? 0.04 : 0.15 + 0.75 * (count / max);
                return (
                  <td
                    key={final}
                    title={`AI suggested ${VERDICTS[ai].label}, reviewer chose ${VERDICTS[final].label}: ${count}`}
                    className={`h-9 rounded-md text-center tabular-nums ${ai === final ? "ring-1 ring-glow/60" : ""}`}
                    style={{ background: `rgb(57 135 229 / ${alpha})` }}
                  >
                    {count || ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
