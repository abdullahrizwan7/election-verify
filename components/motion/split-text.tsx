import type { CSSProperties } from "react";

/**
 * Headline whose words rise in one after another. Pure CSS (see .split-word in
 * globals.css), so it plays as soon as the page paints, before any JavaScript loads.
 */
export function SplitText({ text, className, delay = 0, step = 40 }: { text: string; className?: string; delay?: number; step?: number }) {
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text} role="text">
      {words.map((word, i) => (
        <span key={i} aria-hidden className="split-word">
          <span style={{ "--d": `${delay + i * step}ms` } as CSSProperties}>
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </span>
  );
}
