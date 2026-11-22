import { Fragment, type CSSProperties } from "react";

/**
 * Headline whose words rise in one after another. Pure CSS (see .split-word in
 * globals.css), so it plays as soon as the page paints, before any JavaScript loads.
 */
export function SplitText({ text, className, delay = 0, step = 40 }: { text: string; className?: string; delay?: number; step?: number }) {
  const words = text.split(" ");
  // Keep the last two words together so a line never ends with one word alone ("it.").
  if (words.length > 2) words.splice(-2, 2, `${words[words.length - 2]}\u00a0${words[words.length - 1]}`);
  return (
    <span className={className} aria-label={text} role="text">
      {/* Real spaces between the words let the browser balance the lines. */}
      {words.map((word, i) => (
        <Fragment key={i}>
          <span aria-hidden className="split-word">
            <span style={{ "--d": `${delay + i * step}ms` } as CSSProperties}>{word}</span>
          </span>
          {i < words.length - 1 && " "}
        </Fragment>
      ))}
    </span>
  );
}
