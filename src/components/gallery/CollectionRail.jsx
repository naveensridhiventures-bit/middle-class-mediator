import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { optimizedImageUrl } from "../../lib/cloudinary";
import { emiFrom, inrShort, isNew } from "../../lib/gallery";

export function RailCard({ l }) {
  const emi = emiFrom(l);
  return (
    <Link
      to={`/gallery/${l.id}`}
      className="rail-card group relative shrink-0 w-[64vw] max-w-[17rem] sm:w-64 snap-start overflow-hidden rounded-2xl bg-surface ring-1 ring-ink/[0.07] shadow-[0_10px_26px_-18px_rgba(10,17,36,0.6)] hover:shadow-[0_18px_34px_-16px_rgba(10,17,36,0.55)] transition-shadow active:scale-[0.985]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-dark">
        {l.images[0] && (
          <img src={optimizedImageUrl(l.images[0], 520)} alt="" loading="lazy" decoding="async" draggable={false} className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-dark/55 to-transparent" aria-hidden="true" />
        {isNew(l) && <span className="absolute top-2 left-2 rounded-full bg-[#C99A4A] text-ink-dark text-[10.5px] font-bold uppercase tracking-wide px-2.5 py-1">Just listed</span>}
      </div>
      <div className="p-3">
        <p className="font-display font-bold text-[14.5px] text-ink leading-tight line-clamp-1">{l.title}</p>
        <p className="mt-1 flex items-center gap-1 text-[12px] text-ink/55"><MapPin size={12} className="shrink-0" /><span className="truncate">{l.area || l.location}</span></p>
        <p className="mt-2 flex items-baseline justify-between gap-2">
          <span className="font-bold text-[14px] text-ink">{l.price || "Price on request"}</span>
          {emi > 0 && <span className="text-[11px] text-ink/50 shrink-0">EMI {inrShort(emi)}/mo</span>}
        </p>
      </div>
    </Link>
  );
}

/** A themed, horizontally-scrolling shelf of listings. */
export default function CollectionRail({ title, subtitle, items, eyebrow }) {
  if (!items.length) return null;
  return (
    <section className="mt-9" aria-label={title}>
      <div className="mb-3">
        {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#A8782A]">{eyebrow}</p>}
        <h2 className="font-display font-bold text-ink text-[1.4rem] sm:text-2xl leading-tight">{title}</h2>
        {subtitle && <p className="text-[13.5px] text-ink/55 mt-0.5">{subtitle}</p>}
      </div>
      <div className="-mx-4 px-4 flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-px-4 pb-2">
        {items.map((l) => <RailCard key={l.id} l={l} />)}
      </div>
    </section>
  );
}
