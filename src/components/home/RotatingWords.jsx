import { useEffect, useState } from "react";

/**
 * A line of text where one word rolls up and out while the next rolls in
 * from below, like a departures board. The words sit stacked in one grid
 * cell so the box is always as wide as the widest word (no layout jump).
 * Under "reduce motion" it simply shows the first word.
 */
export default function RotatingWords({ words, interval = 2400, className = "" }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = setInterval(() => setActive((n) => (n + 1) % words.length), interval);
    return () => clearInterval(timer);
  }, [words.length, interval]);

  return (
    <span className={`roll ${className}`}>
      {/* Screen readers get the whole list once instead of a flickering word */}
      <span className="sr-only">{words.join(", ")}</span>
      {words.map((word, i) => {
        const state =
          i === active ? "is-active" : i === (active - 1 + words.length) % words.length ? "is-prev" : "is-next";
        return (
          <span key={word} aria-hidden="true" className={`roll-word ${state}`}>
            {word}
          </span>
        );
      })}
    </span>
  );
}
