import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Images } from "lucide-react";
import Burst from "./Burst";
import SoldOutStamp from "../SoldOutStamp";

/**
 * One listing in the grid: a full-bleed photo with the title and area over
 * the bottom, the price top-left, a heart top-right and a photo count.
 *
 * On a computer, hovering slowly cycles through the listing's photos and
 * pushes in; on a phone it stays calm (no sticky hover). The heart saves the
 * listing on this device and gives a little pop when you tap it.
 *
 * p: { id, title, location, price, soldOut, fresh, meta, images: [url, ...] }
 */
export default function PropertyTile({ p, saved, onToggleSaved }) {
  const [hover, setHover] = useState(false);
  const [photo, setPhoto] = useState(0);
  const [armed, setArmed] = useState(false); // load extra photos only after the first hover
  const [popping, setPopping] = useState(false);
  const [burst, setBurst] = useState(0);
  const count = p.images.length;
  const shown = armed ? p.images : p.images.slice(0, 1);

  useEffect(() => {
    if (!hover || count < 2) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = setInterval(() => setPhoto((n) => (n + 1) % count), 1100);
    return () => clearInterval(timer);
  }, [hover, count]);

  useEffect(() => {
    if (!popping) return undefined;
    const t = setTimeout(() => setPopping(false), 700);
    return () => clearTimeout(t);
  }, [popping]);

  function onHeart(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!saved) {
      setPopping(true);
      setBurst((n) => n + 1);
    }
    onToggleSaved(p.id);
  }

  return (
    <Link
      to={`/gallery/${p.id}`}
      className="tile group relative isolate block overflow-hidden rounded-2xl bg-ink-dark aspect-[4/4.3] sm:aspect-[4/3] shadow-[0_8px_22px_-12px_rgba(10,17,36,0.55)] hover:shadow-[0_18px_34px_-14px_rgba(10,17,36,0.6)] transition-shadow active:scale-[0.985]"
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        setArmed(true);
        setHover(true);
      }}
      onPointerLeave={() => {
        setHover(false);
        setPhoto(0);
      }}
      aria-label={`${p.title}${p.location ? `, ${p.location}` : ""}${p.price && !p.soldOut ? `, ${p.price}` : ""}`}
    >
      <div className={`absolute inset-0 -z-10 transition-transform duration-[1200ms] ease-out group-hover:scale-110 ${p.soldOut ? "grayscale opacity-75" : ""}`}>
        {count === 0 ? (
          <div className="w-full h-full bg-gradient-to-br from-ink-light to-ink-dark" />
        ) : (
          shown.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              draggable={false}
              loading="lazy"
              decoding="async"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === photo ? "opacity-100" : "opacity-0"}`}
            />
          ))
        )}
      </div>
      <span className="sheen" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-dark/90 via-ink-dark/15 to-ink-dark/25" aria-hidden="true" />

      {p.price && !p.soldOut && (
        <span className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          <span className="rounded-full bg-ink-dark/70 backdrop-blur-sm text-white text-[12px] font-bold px-2.5 py-1">{p.price}</span>
          {p.fresh && <span className="rounded-full bg-[#C99A4A] text-ink-dark text-[10px] font-bold uppercase tracking-wide px-2 py-0.5">Just listed</span>}
        </span>
      )}
      {p.soldOut && <SoldOutStamp size="sm" />}

      <button
        type="button"
        onClick={onHeart}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${p.title} from saved` : `Save ${p.title}`}
        className={`absolute top-2 right-2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-90 ${
          saved ? "bg-white text-[#E5584A]" : "bg-ink-dark/45 text-white hover:bg-ink-dark/65"
        } ${popping ? "heart-pop" : ""} ${p.soldOut ? "!hidden" : ""}`}
      >
        <Heart size={19} fill={saved ? "currentColor" : "none"} strokeWidth={2.2} />
        <Burst fire={burst} count={10} spread={38} />
      </button>

      <div className="absolute inset-x-3 bottom-2.5 flex items-end justify-between gap-2 pointer-events-none">
        <div className="min-w-0">
          <h3 className="font-display font-bold text-white text-[15px] sm:text-base leading-tight line-clamp-2 drop-shadow">{p.title}</h3>
          {p.location && (
            <p className="mt-1 flex items-center gap-1 text-white/85 text-[12.5px]">
              <MapPin size={13} className="shrink-0" />
              <span className="truncate">{p.location.split(",")[0].trim()}</span>
            </p>
          )}
          {p.meta && <p className="mt-1 text-[11.5px] font-semibold text-[#E6C173] truncate">{p.meta}</p>}
        </div>
        {count > 0 && (
          <span className="shrink-0 flex items-center gap-1.5 rounded-full bg-ink-dark/65 text-white text-[12px] font-bold px-2.5 py-1">
            <Images size={13} />
            {count}
          </span>
        )}
      </div>
    </Link>
  );
}
