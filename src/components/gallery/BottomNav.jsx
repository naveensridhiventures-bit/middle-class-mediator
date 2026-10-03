import { Link } from "react-router-dom";
import { House, Image as ImageIcon, Plus, MessageCircle, Heart } from "lucide-react";
import { whatsappLink } from "../../lib/whatsapp";
import { ADMIN_WHATSAPP_NUMBER } from "../../lib/config";

const item = "flex flex-col items-center justify-center gap-1 min-w-[3.6rem] py-1 text-[11px] font-semibold transition-colors";

/**
 * Bottom bar for the gallery list: Home, Gallery (current), a gold "+" to
 * list your own property, Chat (WhatsApp) and Saved (your hearts).
 */
export default function BottomNav({ savedCount, savedActive, onSaved }) {
  return (
    <nav
      aria-label="Main"
      className="fixed bottom-0 inset-x-0 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[30rem] z-40 bg-ink-dark rounded-t-[1.5rem] shadow-[0_-12px_30px_-12px_rgba(10,17,36,0.6)]"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="max-w-md mx-auto px-3 pt-2 flex items-end justify-between">
        <Link to="/" className={`${item} text-white/75 hover:text-white`}>
          <House size={22} />
          Home
        </Link>
        <span className={`${item} ${savedActive ? "text-white/75" : "text-[#E6C173]"}`} aria-current={savedActive ? undefined : "page"}>
          <ImageIcon size={22} />
          Gallery
        </span>
        <Link
          to="/seller"
          aria-label="List your property"
          className="plus-btn relative -mt-7 w-14 h-14 rounded-full bg-[#C99A4A] text-ink-dark flex items-center justify-center shadow-[0_10px_22px_-6px_rgba(201,154,74,0.8)] ring-4 ring-ink-dark active:scale-95 transition-transform"
        >
          <span className="plus-pulse absolute inset-0 rounded-full bg-[#C99A4A]" aria-hidden="true" />
          <Plus size={28} strokeWidth={2.6} className="relative" />
        </Link>
        <a
          href={whatsappLink(ADMIN_WHATSAPP_NUMBER, "Hi, I have a question about the property gallery.")}
          target="_blank"
          rel="noreferrer"
          className={`${item} text-white/75 hover:text-white`}
        >
          <MessageCircle size={22} />
          Chat
        </a>
        <button type="button" onClick={onSaved} aria-pressed={savedActive} className={`${item} relative ${savedActive ? "text-[#E6C173]" : "text-white/75 hover:text-white"}`}>
          <Heart size={22} fill={savedActive ? "currentColor" : "none"} />
          Saved
          {savedCount > 0 && (
            <span className="absolute top-0 right-2 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[#E5584A] text-white text-[10px] font-bold flex items-center justify-center">
              {savedCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
