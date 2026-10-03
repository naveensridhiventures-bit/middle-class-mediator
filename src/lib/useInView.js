import { useEffect, useState } from "react";

/**
 * True once the element has scrolled into view (and stays true). Used to
 * start one-time animations — drawing a line, popping in a badge — at the
 * moment the person actually reaches them.
 */
export default function useInView(ref, { threshold = 0.25 } = {}) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, seen, threshold]);
  return seen;
}
