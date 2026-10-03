import { Link } from "react-router-dom";
import { Handshake } from "lucide-react";
import { HERO_IMAGE } from "../../lib/brand";

export const headerBtnCls =
  "relative w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors active:scale-95";

/**
 * The gallery's dark header: a softly blurred, slowly drifting photo behind
 * the MCM mark, with a button on each side (back on the left, actions on the
 * right). Used on both the gallery and the property page.
 */
export default function ShowcaseHeader({ left = null, right = null }) {
  return (
    <header className="relative isolate overflow-hidden rounded-b-[1.75rem] bg-ink-dark">
      <img
        src={HERO_IMAGE}
        alt=""
        aria-hidden="true"
        className="hero-photo absolute inset-0 -z-10 w-full h-full object-cover object-[72%_32%] opacity-60 blur-[3px]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-dark/65 via-ink-dark/50 to-ink-dark/90" aria-hidden="true" />
      <div
        className="max-w-6xl mx-auto px-4 pb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="flex justify-start gap-2">{left}</div>
        <Link to="/" className="fade-up flex flex-col items-center text-center leading-none" aria-label="Middle Class Mediator, home">
          <span className="font-display font-semibold text-[#E6C173] text-[1.9rem] tracking-tight">MCM</span>
          <Handshake size={18} className="text-[#E6C173] mt-1" strokeWidth={2} />
          <span className="font-display font-semibold text-white text-[1.02rem] mt-1.5 whitespace-nowrap">
            Middle Class <span className="text-[#E6C173]">Mediator</span>
          </span>
        </Link>
        <div className="flex justify-end gap-2">{right}</div>
      </div>
    </header>
  );
}
