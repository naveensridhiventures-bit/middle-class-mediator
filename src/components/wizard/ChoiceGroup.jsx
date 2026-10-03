import { useId } from "react";
import { Check } from "lucide-react";

/**
 * One question, answered by tapping a card. Replaces the old chip grid:
 * big touch targets, a radio dot that turns into a tick when chosen.
 * The highlight colour comes from the wizard's --accent variable, so it
 * matches whichever step you're on. Optional questions can be un-picked
 * by tapping the chosen card again.
 */
export default function ChoiceGroup({ label, required = false, options, value, onChange, columns }) {
  const labelId = useId();
  const longest = Math.max(...options.map((o) => o.length));
  const cols = columns ?? (options.length <= 4 && longest <= 14 ? 2 : 1);

  return (
    <div className="mt-7 first:mt-0">
      {label && (
        <p id={labelId} className="font-display font-bold text-ink text-[17px] mb-3">
          {label}
          {required && <span className="text-coral ml-1" aria-hidden="true">*</span>}
        </p>
      )}
      <div
        role="radiogroup"
        aria-labelledby={label ? labelId : undefined}
        className={`grid gap-2.5 ${cols === 2 ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              key={opt}
              onClick={() => onChange(selected && !required ? "" : opt)}
              className="flex items-center justify-between gap-3 min-h-[3.1rem] rounded-xl border bg-white px-4 py-3 text-left text-[14px] font-medium transition-colors active:scale-[0.99]"
              style={{
                borderColor: selected ? "var(--accent)" : "rgba(27,42,74,0.14)",
                boxShadow: selected ? "inset 0 0 0 1px var(--accent)" : "none",
                backgroundColor: selected ? "color-mix(in srgb, var(--accent) 8%, white)" : "#fff",
                color: "#1B2A4A",
              }}
            >
              <span className={selected ? "font-semibold" : ""}>{opt}</span>
              {selected ? (
                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent)" }}>
                  <Check size={12} className="text-white" strokeWidth={3.5} />
                </span>
              ) : (
                <span className="w-5 h-5 rounded-full border-2 border-ink/20 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
