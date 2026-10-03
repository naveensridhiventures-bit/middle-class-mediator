import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin } from "lucide-react";
import SoldOutStamp from "../SoldOutStamp";
import { optimizedImageUrl } from "../../lib/cloudinary";
import { specsFor } from "../../lib/gallery";

/** The heart on a card: saves the listing on this phone, with a little pop. */
function HeartButton({ listing, saved, onToggle, size = 40 }) {
  const [popping, setPopping] = useState(false);
  useEffect(() => {
    if (!popping) return undefined;
    const t = setTimeout(() => setPopping(false), 700);
    return () => clearTimeout(t);
  }, [popping]);
  if (listing.sold) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!saved) setPopping(true);
        onToggle(listing.id);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${listing.title} from saved` : `Save ${listing.title}`}
      style={{ width: size, height: size }}
      className={`absolute top-2 right-2 z-10 rounded-full flex items-center justify-center transition-colors active:scale-90 ${
        saved ? "bg-white text-[#E5584A]" : "bg-white/85 text-ink hover:bg-white"
      } ${popping ? "heart-pop" : ""}`}
    >
      <Heart size={19} fill={saved ? "currentColor" : "none"} strokeWidth={2.2} />
    </button>
  );
}

/** Photos for a card. On a computer, hovering cycles through the listing's photos. */
function CardPhoto({ listing, width, className = "" }) {
  const [hover, setHover] = useState(false);
  const [photo, setPhoto] = useState(0);
  const [armed, setArmed] = useState(false); // load extra photos only after the first hover
  const count = listing.images.length;
  const urls = (armed ? listing.images : listing.images.slice(0, 1)).map((u) => optimizedImageUrl(u, width));

  useEffect(() => {
    if (!hover || count < 2) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = setInterval(() => setPhoto((n) => (n + 1) % count), 1100);
    return () => clearInterval(timer);
  }, [hover, count]);

  return (
    <div
      className={`relative overflow-hidden bg-ink-dark ${className}`}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        setArmed(true);
        setHover(true);
      }}
      onPointerLeave={() => {
        setHover(false);
        setPhoto(0);
      }}
    >
      <div className={`absolute inset-0 transition-transform duration-[1200ms] ease-out group-hover:scale-110 ${listing.sold ? "grayscale opacity-75" : ""}`}>
        {count === 0 ? (
          <div className="w-full h-full bg-gradient-to-br from-ink-light to-ink-dark" />
        ) : (
          urls.map((src, i) => (
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
      {listing.sold && <SoldOutStamp size="sm" />}
    </div>
  );
}

function Price({ listing }) {
  if (!listing.price) return <p className="text-[13px] text-ink/45">Price on request</p>;
  return (
    <p className={`font-display font-bold text-[1.05rem] ${listing.sold ? "text-ink/40 line-through" : "text-ink"}`}>{listing.price}</p>
  );
}

/** Big card for "Featured properties": wide photo, then title, area, price and the specs row. */
export function FeaturedCard({ listing, saved, onToggleSaved }) {
  const specs = specsFor(listing);
  return (
    <Link
      to={`/gallery/${listing.id}`}
      className="tile group block h-full rounded-3xl bg-surface ring-1 ring-ink/[0.06] shadow-[0_12px_30px_-16px_rgba(27,42,74,0.4)] overflow-hidden active:scale-[0.99] transition-transform"
    >
      <div className="relative">
        <CardPhoto listing={listing} width={900} className="aspect-[2/1]" />
        <HeartButton listing={listing} saved={saved} onToggle={onToggleSaved} />
      </div>
      <div className="p-4">
        <h3 className="font-display font-bold text-[1.2rem] leading-tight text-ink">{listing.title}</h3>
        {listing.location && (
          <p className="mt-1 flex items-center gap-1 text-[13px] text-ink/55">
            <MapPin size={13} className="shrink-0 text-[#A8782A]" />
            {listing.location}
          </p>
        )}
        <div className="mt-1.5"><Price listing={listing} /></div>
        {specs.length > 0 && (
          <ul className="mt-3 pt-3 border-t border-ink/[0.08] flex flex-wrap gap-x-4 gap-y-1.5">
            {specs.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-1.5 text-[12.5px] text-ink/65">
                <Icon size={15} className="shrink-0 text-ink/50" />
                {text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}

/** Compact card for the grid: photo with a heart, then title, area and price. */
export function GridCard({ listing, saved, onToggleSaved }) {
  return (
    <Link
      to={`/gallery/${listing.id}`}
      className="tile group block h-full rounded-2xl bg-surface ring-1 ring-ink/[0.06] shadow-[0_8px_22px_-14px_rgba(27,42,74,0.45)] hover:shadow-[0_18px_34px_-16px_rgba(27,42,74,0.5)] overflow-hidden active:scale-[0.985] transition-[transform,box-shadow]"
    >
      <div className="relative">
        <CardPhoto listing={listing} width={600} className="aspect-[4/3]" />
        <HeartButton listing={listing} saved={saved} onToggle={onToggleSaved} size={36} />
      </div>
      <div className="px-3 pt-2.5 pb-3">
        <h3 className="font-display font-bold text-[15px] leading-tight text-ink line-clamp-1">{listing.title}</h3>
        {listing.area && <p className="text-[12.5px] text-ink/50 mt-0.5 truncate">{listing.area}</p>}
        <div className="mt-1"><Price listing={listing} /></div>
      </div>
    </Link>
  );
}
