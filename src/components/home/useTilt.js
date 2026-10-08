import { useCallback } from "react";

/**
 * Mouse-only 3D tilt + a light that follows the pointer. Writes CSS variables
 * straight to the element, so React never re-renders while you move.
 */
export default function useTilt(max = 6) {
  const onPointerMove = useCallback(
    (e) => {
      if (e.pointerType !== "mouse") return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--ry", `${((x - 0.5) * 2 * max).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${(-(y - 0.5) * 2 * max).toFixed(2)}deg`);
      el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    },
    [max]
  );
  const onPointerLeave = useCallback((e) => {
    const el = e.currentTarget;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }, []);
  return { onPointerMove, onPointerLeave };
}
