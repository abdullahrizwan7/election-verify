"use client";

import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { VERDICTS } from "@/lib/labels";
import type { Verdict } from "@/lib/types";

const config = { count: { label: "Verdicts" } } satisfies ChartConfig;

/**
 * How many published verdicts had each rating. Each bar is labelled with its
 * name and count, so the verdict colors are a helpful extra, never the only clue.
 */
export function VerdictBars({ data }: { data: { verdict: Verdict; count: number }[] }) {
  const rows = [...data].sort((a, b) => b.count - a.count).map((d) => ({ ...d, label: VERDICTS[d.verdict].label }));

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 40, left: 8, bottom: 0 }} barCategoryGap={6}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey="label" width={112} tickLine={false} axisLine={false} />
        <ChartTooltip cursor={{ fillOpacity: 0.08 }} content={<ChartTooltipContent hideIndicator />} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
          {rows.map((row) => (
            <Cell key={row.verdict} fill={`rgb(${VERDICTS[row.verdict].rgb})`} />
          ))}
          <LabelList dataKey="count" position="right" offset={8} fontSize={12} fill="var(--muted-foreground)" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
