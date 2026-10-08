import CountUp from "./CountUp";
import { inrShort } from "../../lib/gallery";

/** Real numbers about what's on offer right now. */
export default function StatsStrip({ properties }) {
  const live = properties.filter((p) => !p.sold);
  if (live.length === 0) return null;
  const areas = new Set(live.map((p) => p.area).filter(Boolean)).size;
  const prices = live.map((p) => p.priceNum).filter((n) => n);
  const range = prices.length >= 2 ? `${inrShort(Math.min(...prices))} – ${inrShort(Math.max(...prices))}` : prices.length === 1 ? inrShort(prices[0]) : "";
  const cells = [
    { v: <CountUp value={live.length} />, l: live.length === 1 ? "Property available" : "Properties available" },
    areas > 0 && { v: <CountUp value={areas} />, l: areas === 1 ? "Area covered" : "Areas covered" },
    range && { v: range, l: "Price range" },
  ].filter(Boolean);
  return (
    <div className="gold-hair rounded-2xl bg-surface grid divide-x divide-ink/10 py-3.5" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
      {cells.map((c, i) => (
        <div key={i} className="px-3 text-center">
          <p className="font-display font-bold text-[1.1rem] sm:text-[1.4rem] leading-none text-ink tabular-nums">{c.v}</p>
          <p className="mt-1.5 text-[10.5px] sm:text-[11.5px] font-bold uppercase tracking-wider text-ink/45">{c.l}</p>
        </div>
      ))}
    </div>
  );
}
