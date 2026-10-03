/**
 * A two-handle slider that moves in fixed steps. Built from two native range
 * inputs laid over each other, so keyboard and screen-reader use work
 * normally. `lo` and `hi` are step positions (0 .. steps-1).
 */
export default function RangeSlider({ steps, lo, hi, onChange, label, valueText }) {
  const max = steps - 1;
  const pct = (n) => (max === 0 ? 0 : (n / max) * 100);
  return (
    <div className="range-dual" role="group" aria-label={label}>
      <div className="range-track" />
      <div className="range-fill" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={lo}
        aria-label={`${label}, minimum`}
        aria-valuetext={valueText(lo)}
        onChange={(e) => onChange(Math.min(Number(e.target.value), hi), hi)}
        style={{ zIndex: lo >= max ? 5 : 3 }}
      />
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={hi}
        aria-label={`${label}, maximum`}
        aria-valuetext={valueText(hi)}
        onChange={(e) => onChange(lo, Math.max(Number(e.target.value), lo))}
        style={{ zIndex: 4 }}
      />
    </div>
  );
}
