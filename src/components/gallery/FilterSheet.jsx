import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, MapPin, ChevronDown } from "lucide-react";
import RangeSlider from "./RangeSlider";
import CountUp from "./CountUp";
import { iconForType } from "./typeIcons";
import { shortType, PRICE_STEPS, SQFT_STEPS, FACINGS, DEFAULT_FILTERS } from "../../lib/gallery";

const GOLD = "#A8782A";

/**
 * Full-height "Filters" sheet (bottom sheet on phones, centred panel on
 * larger screens). Filters apply live, and the button shows how many
 * properties match right now.
 */
export default function FilterSheet({ filters, onChange, types, areas, resultCount, onClose }) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (sbw > 0) body.style.paddingRight = `${sbw}px`;
    return () => {
      window.removeEventListener("keydown", onKey);
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
    };
  }, []);

  const set = (patch) => onChange({ ...filters, ...patch });
  const sqLast = SQFT_STEPS.length - 1;
  const sqText = (i) => `${SQFT_STEPS[i].toLocaleString("en-IN")}${i === sqLast ? "+" : ""} Sq.ft`;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-ink-dark/60 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className="bg-surface w-full sm:max-w-lg h-[94dvh] sm:h-auto sm:max-h-[90dvh] rounded-t-[1.75rem] sm:rounded-[1.75rem] shadow-2xl flex flex-col animate-step"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-2 px-4 pt-4 pb-3">
          <button type="button" onClick={onClose} aria-label="Close filters" className="w-10 h-10 rounded-full hover:bg-ink/5 flex items-center justify-center">
            <ArrowLeft size={22} />
          </button>
          <h2 className="font-display font-semibold text-center text-[1.3rem] text-ink">Filters</h2>
          <button
            type="button"
            onClick={() => onChange({ ...DEFAULT_FILTERS })}
            className="h-10 px-2 text-[14px] font-bold"
            style={{ color: GOLD }}
          >
            Reset
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
          {/* Property type */}
          <section aria-labelledby="f-type">
            <h3 id="f-type" className="font-display font-bold text-[1.05rem] text-ink mt-2 mb-3">Property Type</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {types.map((t) => {
                const on = filters.type === t;
                const Icon = iconForType(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set({ type: on ? "All" : t })}
                    aria-pressed={on}
                    className={`min-h-[3.6rem] rounded-2xl border-2 px-3 py-2 flex items-center gap-2.5 text-left text-[13px] font-semibold leading-tight transition-colors ${
                      on ? "border-[#C99A4A] bg-[#F7EBD2] text-ink" : "border-transparent bg-[#F1ECE3] text-ink/80 hover:bg-[#EAE4D9]"
                    }`}
                  >
                    <Icon size={24} strokeWidth={1.6} className={on ? "text-[#8A6218]" : "text-ink/60"} />
                    {shortType(t)}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Location */}
          {areas.length > 0 && (
            <section className="mt-6" aria-labelledby="f-loc">
              <h3 id="f-loc" className="font-display font-bold text-[1.05rem] text-ink mb-3">Location</h3>
              <div className="relative">
                <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/50 pointer-events-none" />
                <select
                  aria-labelledby="f-loc"
                  value={filters.area}
                  onChange={(e) => set({ area: e.target.value })}
                  className="w-full h-12 appearance-none rounded-2xl border border-ink/10 bg-white pl-10 pr-10 text-[15px] text-ink outline-none focus:border-[#C99A4A]"
                >
                  <option value="All">All areas</option>
                  {areas.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/50 pointer-events-none" />
              </div>
            </section>
          )}

          {/* Price range */}
          <section className="mt-6" aria-labelledby="f-price">
            <h3 id="f-price" className="font-display font-bold text-[1.05rem] text-ink mb-1">Price Range</h3>
            <RangeSlider
              steps={PRICE_STEPS.length}
              lo={filters.priceLo}
              hi={filters.priceHi}
              onChange={(lo, hi) => set({ priceLo: lo, priceHi: hi })}
              label="Price range"
              valueText={(i) => PRICE_STEPS[i].label}
            />
            <div className="flex items-center justify-between text-[13px] text-ink/65">
              <span>{PRICE_STEPS[filters.priceLo].label}</span>
              <span>{PRICE_STEPS[filters.priceHi].label}</span>
            </div>
          </section>

          {/* Area */}
          <section className="mt-6" aria-labelledby="f-sqft">
            <h3 id="f-sqft" className="font-display font-bold text-[1.05rem] text-ink mb-1">Area (Sq.ft)</h3>
            <RangeSlider
              steps={SQFT_STEPS.length}
              lo={filters.sqftLo}
              hi={filters.sqftHi}
              onChange={(lo, hi) => set({ sqftLo: lo, sqftHi: hi })}
              label="Area in square feet"
              valueText={sqText}
            />
            <p className="text-[13px] text-ink/65">
              {SQFT_STEPS[filters.sqftLo].toLocaleString("en-IN")} – {sqText(filters.sqftHi)}
            </p>
          </section>

          {/* Facing */}
          <section className="mt-6" aria-labelledby="f-face">
            <h3 id="f-face" className="font-display font-bold text-[1.05rem] text-ink mb-3">Facing</h3>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="f-face">
              {FACINGS.map((f) => {
                const on = filters.facing === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => set({ facing: f })}
                    aria-pressed={on}
                    className={`h-10 min-w-[3.6rem] px-4 rounded-xl text-[13px] font-semibold transition-colors ${
                      on ? "bg-ink text-white" : "bg-[#F1ECE3] text-ink/75 hover:bg-[#EAE4D9]"
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="px-5 pt-3 border-t border-ink/[0.07]" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-14 rounded-2xl bg-ink-dark text-white font-display font-semibold text-[1.05rem] active:scale-[0.99] transition-transform"
          >
            Show Results (<CountUp value={resultCount} duration={450} />)
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
