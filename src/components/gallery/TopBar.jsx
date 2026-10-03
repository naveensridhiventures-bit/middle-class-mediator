import { ArrowLeft } from "lucide-react";

export const roundBtn =
  "relative w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-colors active:scale-95";

/**
 * The slim header used across the gallery pages: back button, centred serif
 * title, and one slot on the right. `dark` is the navy version used on the
 * photos and enquiry pages.
 */
export default function TopBar({ title, onBack, right = null, dark = false }) {
  return (
    <header
      className={dark ? "bg-ink-dark rounded-b-[1.75rem]" : ""}
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <div className={`max-w-6xl mx-auto px-4 ${dark ? "pb-4" : "pb-2"} grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2`}>
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className={`${roundBtn} ${dark ? "text-white hover:bg-white/10" : "text-ink hover:bg-ink/5"}`}
        >
          <ArrowLeft size={22} />
        </button>
        <h1
          className={`font-display font-semibold text-center text-[1.3rem] leading-tight ${dark ? "text-white" : "text-ink"}`}
          aria-label={title}
        >
          <span aria-hidden="true" className="mask-word">
            <span className="mask-inner" style={{ "--d": "60ms" }}>{title}</span>
          </span>
        </h1>
        <div className="flex justify-end">{right}</div>
      </div>
    </header>
  );
}
