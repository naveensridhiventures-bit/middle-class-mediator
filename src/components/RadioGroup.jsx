export default function RadioGroup({ label, options, value, onChange, accentColor = "#1B2A4A" }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <button
              type="button"
              key={opt}
              onClick={() => onChange(opt)}
              aria-pressed={selected}
              className="px-4 py-2 rounded-full border-2 text-sm font-medium transition active:scale-[0.97]"
              style={{
                borderColor: selected ? accentColor : "rgba(27,42,74,0.12)",
                backgroundColor: selected ? accentColor : "rgba(255,255,255,0.7)",
                color: selected ? "#FAF6EF" : "rgba(27,42,74,0.7)",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
