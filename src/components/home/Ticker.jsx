const DEFAULT_WORDS = ["Homes", "Flats", "Villas", "Plots & Lands", "Shops", "Hotels", "Restaurants", "Offices", "Chennai"];

/**
 * A slow, endless ribbon of words. Decorative only (hidden from screen
 * readers). If there are only a few words they are repeated so the ribbon
 * always fills the screen. `light` is the version for cream backgrounds.
 */
export default function Ticker({ words = DEFAULT_WORDS, light = false }) {
  const list = words.length >= 8 ? words : Array.from({ length: Math.ceil(8 / words.length) * words.length }, (_, i) => words[i % words.length]);
  return (
    <div
      className={`ticker-mask relative overflow-hidden py-3 ${light ? "border-y border-ink/10" : "border-y border-gold/25 bg-black/25"}`}
      aria-hidden="true"
    >
      <div className="ticker-track flex w-max">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {list.map((w, i) => (
              <li key={`${w}-${i}`} className="flex items-center">
                <span className={`px-5 text-[12px] font-bold uppercase tracking-[0.24em] ${light ? "text-ink/60" : "text-paper/80"}`}>{w}</span>
                <span className="w-1.5 h-1.5 rotate-45 bg-gold/80" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
