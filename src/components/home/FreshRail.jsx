import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { RailCard } from "../gallery/CollectionRail";

/** Newest real listings, straight from the gallery. Nothing shows if there are none. */
export default function FreshRail({ properties }) {
  if (properties === null) {
    return (
      <div className="mt-10" aria-hidden="true">
        <div className="h-7 w-56 rounded-md skeleton" />
        <div className="mt-4 flex gap-3 overflow-hidden -mx-4 px-4">
          {[0, 1, 2].map((i) => <div key={i} className="shrink-0 w-[64vw] max-w-[17rem] sm:w-64 aspect-[4/4.2] rounded-2xl skeleton" />)}
        </div>
      </div>
    );
  }
  const items = properties.filter((p) => !p.sold && p.images.length > 0).slice(0, 8);
  if (items.length === 0) return null;
  return (
    <section className="mt-10" aria-label="New listings">
      <div className="flex items-end justify-between gap-3 mb-3.5">
        <div>
          <h2 className="font-display font-bold text-ink text-[1.5rem] sm:text-3xl leading-tight">New on the market</h2>
          <p className="text-[14px] text-ink/55 mt-0.5">Fresh listings from our sellers</p>
        </div>
        <Link to="/gallery" className="group shrink-0 flex items-center gap-1.5 text-[14px] font-bold text-[#8A6218]">
          See all <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      <div className="-mx-4 sm:-mx-5 px-4 sm:px-5 flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-px-4 pb-3">
        {items.map((l) => <RailCard key={l.id} l={l} />)}
      </div>
    </section>
  );
}
