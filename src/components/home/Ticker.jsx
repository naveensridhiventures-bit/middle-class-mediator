const WORDS = ["Homes", "Flats", "Villas", "Plots & Lands", "Shops", "Hotels", "Restaurants", "Offices", "Chennai"];

/** A slow, endless ribbon of the property types we handle. Decorative only. */
export default function Ticker() {
  return (
    <div className="ticker-mask relative overflow-hidden border-y border-gold/25 bg-black/25 py-3" aria-hidden="true">
      <div className="ticker-track flex w-max">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {WORDS.map((w) => (
              <li key={w} className="flex items-center">
                <span className="px-5 text-[12px] font-bold uppercase tracking-[0.24em] text-paper/80">{w}</span>
                <span className="w-1.5 h-1.5 rotate-45 bg-gold/80" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
