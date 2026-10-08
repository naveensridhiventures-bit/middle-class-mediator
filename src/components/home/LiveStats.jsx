import { useRef } from "react";
import CountUp from "../gallery/CountUp";
import useInView from "../../lib/useInView";
import { inrShort } from "../../lib/gallery";

/** Real numbers from the live gallery; hidden until there is something to count. */
export default function LiveStats({ properties }) {
  const ref = useRef(null);
  const seen = useInView(ref, { threshold: 0.4 });
  const live = (properties || []).filter((p) => !p.sold);
  if (live.length === 0) return <div ref={ref} />;
  const areas = new Set(live.map((p) => p.area).filter(Boolean)).size;
  const prices = live.map((p) => p.priceNum).filter(Boolean);
  const cells = [
    { v: seen ? <CountUp value={live.length} duration={1100} /> : 0, l: live.length === 1 ? "property listed" : "properties listed" },
    areas > 0 && { v: seen ? <CountUp value={areas} duration={1100} /> : 0, l: areas === 1 ? "area in Chennai" : "areas in Chennai" },
    prices.length > 1 && { v: `${inrShort(Math.min(...prices))} – ${inrShort(Math.max(...prices))}`, l: "price range" },
  ].filter(Boolean);
  return (
    <div ref={ref} className="mt-8 rounded-3xl bg-ink-dark text-white grid divide-x divide-white/10 py-5 shadow-[0_18px_36px_-20px_rgba(10,17,36,0.8)]" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
      {cells.map((c, i) => (
        <div key={i} className="px-3 text-center">
          <p className="font-display font-bold text-[1.35rem] sm:text-[2rem] leading-none text-[#E6C173] tabular-nums">{c.v}</p>
          <p className="mt-2 text-[12px] sm:text-[13.5px] text-white/60">{c.l}</p>
        </div>
      ))}
    </div>
  );
}
