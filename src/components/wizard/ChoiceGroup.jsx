import { useId } from "react";
import { Check } from "lucide-react";

/**
 * One question, answered by tapping a card. Cards rise in one after another,
 * ripple where you tap, and the chosen one pops and draws its tick.
 * The highlight colour comes from the wizard's --accent variable.
 * Optional questions can be un-picked by tapping the chosen card again.
 */
export default function ChoiceGroup({ label, required = false, options, value, onChange, columns }) {
  const labelId = useId();
  const longest = Math.max(...options.map((o) => o.length));
  const cols = columns ?? (options.length <= 4 && longest <= 14 ? 2 : 1);

  function pick(opt, selected) {
    try {
      navigator.vibrate?.(8);
    } catch {
      // not supported: fine
    }
    onChange(selected && !required ? "" : opt);
  }

  return (
    <div className="mt-7 first:mt-0">
      {label && (
        <p id={labelId} className="font-display font-bold text-ink text-[17px] mb-3">
          {label}
          {required && <span className="text-coral ml-1" aria-hidden="true">*</span>}
        </p>
      )}
      <div role="radiogroup" aria-labelledby={label ? labelId : undefined} className={`grid gap-2.5 ${cols === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
        {options.map((opt, i) => {
          const selected = value === opt;
          return (
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              key={opt}
              onClick={() => pick(opt, selected)}
              data-selected={selected}
              style={{ "--i": i }}
              className="choice rip flex items-center justify-between gap-3 min-h-[3.2rem] rounded-2xl border bg-white px-4 py-3 text-left text-[14.5px] font-medium text-ink active:scale-[0.98]"
            >
              <span className={selected ? "font-semibold" : ""}>{opt}</span>
              {selected ? (
                <span className="choice-dot w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent)" }}>
                  <Check size={13} className="text-white" strokeWidth={3.6} />
                </span>
              ) : (
                <span className="w-[22px] h-[22px] rounded-full border-2 border-ink/20 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
