import type { CSSProperties } from "react";

/**
 * A ring that fills up to the AI's confidence when it appears.
 * The number in the middle is the real value; the ring is a visual extra.
 */
export function ConfidenceGauge({ value, size = 76 }: { value: number | null; size?: number }) {
  if (value == null) return null;
  const pct = Math.round(value * 100);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const color = value >= 0.8 ? "#10b981" : value >= 0.6 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} title={`AI confidence ${pct}%`}>
      <svg viewBox="0 0 76 76" className="size-full -rotate-90" aria-hidden>
        <circle cx="38" cy="38" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
        <circle
          cx="38"
          cy="38"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          className="animate-gauge"
          style={
            {
              "--gauge-from": circumference,
              "--gauge-to": circumference * (1 - value),
              strokeDashoffset: circumference * (1 - value),
              filter: `drop-shadow(0 0 6px ${color})`,
            } as CSSProperties
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg leading-none font-semibold tabular-nums">{pct}%</span>
        <span className="mt-0.5 text-[9px] tracking-wider text-muted-foreground uppercase">sure</span>
      </div>
    </div>
  );
}
