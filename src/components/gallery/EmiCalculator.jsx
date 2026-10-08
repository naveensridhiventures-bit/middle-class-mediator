import { useState } from "react";
import { Calculator } from "lucide-react";
import { emi, inr, inrShort, EMI_DEFAULTS } from "../../lib/gallery";

function Slider({ label, value, min, max, step, onChange, display }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <span className="flex items-center justify-between text-[13px]">
        <span className="font-semibold text-ink/75">{label}</span>
        <span className="font-bold text-ink tabular-nums">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="emi-range mt-2 w-full"
        style={{ "--p": `${pct}%` }}
      />
    </label>
  );
}

/** Indicative home-loan estimate. Every assumption is editable and labelled. */
export default function EmiCalculator({ price }) {
  const [downPct, setDownPct] = useState(EMI_DEFAULTS.downPct);
  const [rate, setRate] = useState(EMI_DEFAULTS.rate);
  const [years, setYears] = useState(EMI_DEFAULTS.years);

  const down = price * (downPct / 100);
  const loan = price - down;
  const r = emi(loan, rate, years);
  const principalShare = r.total ? loan / r.total : 1;

  // Donut: principal (ink) vs interest (gold)
  const C = 2 * Math.PI * 42;
  const pLen = C * principalShare;

  return (
    <section className="rounded-3xl bg-surface ring-1 ring-ink/[0.07] p-5 shadow-[0_10px_30px_-22px_rgba(10,17,36,0.5)]" aria-label="EMI calculator">
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-xl bg-[#F6EEDB] text-[#A8782A] flex items-center justify-center"><Calculator size={18} /></span>
        <div>
          <h2 className="font-display font-bold text-[1.1rem] text-ink leading-none">Plan your EMI</h2>
          <p className="text-[12px] text-ink/50 mt-1">Slide to match your loan</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-5">
        <svg viewBox="0 0 100 100" className="w-28 h-28 shrink-0 -rotate-90" role="img" aria-label={`Principal ${Math.round(principalShare * 100)} percent, interest ${Math.round((1 - principalShare) * 100)} percent`}>
          <circle cx="50" cy="50" r="42" fill="none" stroke="#C99A4A" strokeWidth="11" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="#1B2A4A" strokeWidth="11" strokeDasharray={`${pLen} ${C}`} strokeLinecap="butt" style={{ transition: "stroke-dasharray .5s ease" }} />
        </svg>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink/45">Monthly EMI</p>
          <p className="font-display font-bold text-[1.9rem] leading-none text-ink tabular-nums mt-1.5">{inr(r.emi)}</p>
          <p className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink/60">
            <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-[#1B2A4A]" />Loan {inrShort(loan)}</span>
            <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-[#C99A4A]" />Interest {inrShort(r.interest)}</span>
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <Slider label="Down payment" value={downPct} min={10} max={80} step={5} onChange={setDownPct} display={`${downPct}% · ${inrShort(down)}`} />
        <Slider label="Interest rate" value={rate} min={6.5} max={14} step={0.25} onChange={setRate} display={`${rate}%`} />
        <Slider label="Tenure" value={years} min={5} max={30} step={1} onChange={setYears} display={`${years} years`} />
      </div>

      <p className="mt-4 text-[11px] text-ink/40 leading-snug">
        Indicative only. Your bank's rate, fees and eligibility decide the real figure.
      </p>
    </section>
  );
}
