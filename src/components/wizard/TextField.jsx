import { useId } from "react";

export const isValidPhone = (v) => /^\d{10}$/.test(v || "");

const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-ink/60 mb-2";
const inputCls =
  "w-full rounded-xl border border-ink/10 bg-[#F7F5F1] px-4 py-3.5 text-[15px] text-ink placeholder:text-ink/35 outline-none transition " +
  "focus:bg-white focus:border-[color:var(--accent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)]";

export default function TextField({ label, required = false, error = "", hint = "", multiline = false, className = "", ...props }) {
  const id = useId();
  const noteId = `${id}-note`;
  const Tag = multiline ? "textarea" : "input";
  return (
    <div className={`mt-5 first:mt-0 ${className}`}>
      <label htmlFor={id} className={labelCls}>
        {label}
        {required && <span className="text-coral ml-1" aria-hidden="true">*</span>}
      </label>
      <Tag
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? noteId : undefined}
        className={`${inputCls} ${multiline ? "min-h-[110px] resize-y" : ""}`}
        {...props}
      />
      {error ? (
        <p id={noteId} className="text-xs text-coral mt-1.5">{error}</p>
      ) : hint ? (
        <p id={noteId} className="text-xs text-ink/45 mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}

/** 10-digit WhatsApp number — digits only, with a clear message while incomplete. */
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
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      error={incomplete ? "Enter all 10 digits." : ""}
    />
  );
}
