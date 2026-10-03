import { useEffect, useRef, useState } from "react";

/** A number that counts up (or down) to its value instead of just appearing. */
export default function CountUp({ value, duration = 800 }) {
  const [shown, setShown] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      fromRef.current = value;
      return undefined;
    }
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{shown}</>;
}
