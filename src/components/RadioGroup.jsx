export default function RadioGroup({ label, options, value, onChange, accentColor = "#1B2A4A", icons = {}, stepNumber }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        {stepNumber && (
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            {stepNumber}
          </span>
        )}
        <label className="field-label !mb-0">{label}</label>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((opt) => {
          const selected = value === opt;
          const Icon = icons[opt];
          return (
            <button
              type="button"
              key={opt}
              onClick={() => onChange(opt)}
              aria-pressed={selected}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border-2 text-sm font-medium transition active:scale-[0.97] text-left"
              style={{
                borderColor: selected ? accentColor : "rgba(27,42,74,0.12)",
                backgroundColor: selected ? `${accentColor}10` : "rgba(255,255,255,0.7)",
                color: selected ? accentColor : "rgba(27,42,74,0.7)",
              }}
            >
              {Icon && <Icon size={16} strokeWidth={2} className="shrink-0" />}
              <span className="truncate">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
