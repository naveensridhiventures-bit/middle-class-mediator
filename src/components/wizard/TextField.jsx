import { useId } from "react";
import { Check } from "lucide-react";

const labelCls =
  "block text-[13px] font-semibold text-ink/65 mb-2 ml-0.5 transition-colors group-focus-within:text-[color:var(--accent)]";
const inputCls =
  "w-full rounded-2xl border border-ink/10 bg-[#F7F5F1] px-4 py-3.5 text-[16px] text-ink placeholder:text-ink/35 outline-none transition " +
  "focus:bg-white focus:border-[color:var(--accent)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_16%,transparent)]";

/**
 * Text input with a label that lights up in the step colour while you type,
 * and a tick that pops in once the answer is good (pass `valid`).
 * `prefix` is a fixed bit of text shown inside the field (e.g. +91).
 */
export default function TextField({ label, required = false, error = "", hint = "", multiline = false, valid = false, prefix = "", counter = "", className = "", ...props }) {
  const id = useId();
  const noteId = `${id}-note`;
  const Tag = multiline ? "textarea" : "input";
  return (
    <div className={`group mt-5 first:mt-0 ${className}`}>
      <label htmlFor={id} className={labelCls}>
        {label}
        {required && <span className="text-coral ml-1" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-ink/55 pointer-events-none select-none border-r border-ink/10 pr-3">{prefix}</span>
        )}
        <Tag
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? noteId : undefined}
          className={`${inputCls} ${multiline ? "min-h-[110px] resize-y" : ""} ${prefix ? "pl-[4.4rem]" : ""} ${valid || counter ? "pr-12" : ""} ${error ? "!border-coral" : ""}`}
          {...props}
        />
        {valid && !multiline && (
          <span key="ok" className="tick-pop absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--accent)" }} aria-hidden="true">
            <Check size={14} className="text-white" strokeWidth={3.5} />
          </span>
        )}
        {!valid && counter && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-ink/35 tabular-nums" aria-hidden="true">{counter}</span>}
      </div>
      {error ? (
        <p id={noteId} className="text-xs text-coral mt-1.5 ml-0.5">{error}</p>
      ) : hint ? (
        <p id={noteId} className="text-xs text-ink/45 mt-1.5 ml-0.5">{hint}</p>
      ) : null}
    </div>
  );
}

/** 10-digit WhatsApp number: digits only, +91 shown, live counter, tick when complete. */
export function PhoneField({ value, onChange, label = "WhatsApp number" }) {
  const incomplete = value.length > 0 && value.length < 10;
  return (
    <TextField
      label={label}
      required
      type="tel"
      inputMode="numeric"
      autoComplete="tel-national"
      maxLength={10}
      placeholder="10-digit number"
      prefix="+91"
      valid={value.length === 10}
      counter={value.length ? `${value.length}/10` : ""}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      error={incomplete && value.length >= 6 ? "Enter all 10 digits." : ""}
    />
  );
}
