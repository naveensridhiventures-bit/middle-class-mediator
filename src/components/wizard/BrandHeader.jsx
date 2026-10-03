import { Link } from "react-router-dom";

/**
 * The dark navy brand bar shown at the top of every screen: a coloured
 * "M" chip plus the two-line name. The chip colour follows the current
 * step. Tapping it always goes home.
 */
export default function BrandHeader({ color = "#1F6F5C", right = null, wide = false, className = "" }) {
  return (
    <header className={`bg-ink rounded-b-[1.75rem] ${className}`}>
      <div
        className={`mx-auto flex items-center justify-between gap-3 px-5 pb-5 ${wide ? "max-w-6xl" : ""}`}
        style={{ paddingTop: "max(1.1rem, env(safe-area-inset-top))" }}
      >
        <Link to="/" className="flex items-center gap-3" aria-label="Middle Class Mediator — home">
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-white text-lg transition-colors duration-300"
            style={{ backgroundColor: color }}
          >
            M
          </span>
          <span className="leading-tight">
            <span className="block text-[13px] font-bold text-white">Middle Class</span>
            <span className="block text-[11px] text-white/70">Mediator</span>
          </span>
        </Link>
        {right}
      </div>
    </header>
  );
}
