"use client";

import { Area, AreaChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

// Categorical slots 1 and 2 from the validated chart palette (blue, orange), stepped for each theme.
const config = {
  submitted: { label: "Submitted", theme: { light: "#2a78d6", dark: "#3987e5" } },
  published: { label: "Published", theme: { light: "#eb6834", dark: "#d95926" } },
} satisfies ChartConfig;

const shortDate = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** Submissions and published verdicts per day: two series on one axis, both counts. */
export function ActivityChart({ data }: { data: { date: string; submitted: number; published: number }[] }) {
  const last = data.length - 1;
  // The higher line's name goes slightly up and the lower one's slightly down, so they never overlap.
  const submittedOnTop = (data[last]?.submitted ?? 0) >= (data[last]?.published ?? 0);

  // Names the line at its right end, in text color (the line color carries identity).
  const endLabel = (name: string, onTop: boolean) =>
    function EndLabel(props: { index?: number; x?: number | string; y?: number | string }) {
      if (props.index !== last) return null;
      return (
        <text x={Number(props.x) + 8} y={Number(props.y)} dy={onTop ? -4 : 12} fontSize={11} fill="var(--muted-foreground)">
          {name}
        </text>
      );
    };

  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <AreaChart data={data} margin={{ top: 8, right: 76, left: 0, bottom: 0 }}>
        <defs>
          {(["submitted", "published"] as const).map((key) => (
            <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.35} />
              <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} strokeOpacity={0.35} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} tickFormatter={shortDate} />
        <YAxis width={32} tickLine={false} axisLine={false} allowDecimals={false} />
        <ChartTooltip cursor={{ strokeOpacity: 0.4 }} content={<ChartTooltipContent labelFormatter={(value) => shortDate(String(value))} indicator="line" />} />
        <ChartLegend verticalAlign="top" content={<ChartLegendContent />} />
        <Area dataKey="submitted" type="monotone" stroke="var(--color-submitted)" strokeWidth={2} fill="url(#fill-submitted)" activeDot={{ r: 4 }}>
          <LabelList content={endLabel("Submitted", submittedOnTop)} />
        </Area>
        <Area dataKey="published" type="monotone" stroke="var(--color-published)" strokeWidth={2} fill="url(#fill-published)" activeDot={{ r: 4 }}>
          <LabelList content={endLabel("Published", !submittedOnTop)} />
        </Area>
      </AreaChart>
    </ChartContainer>
  );
}
