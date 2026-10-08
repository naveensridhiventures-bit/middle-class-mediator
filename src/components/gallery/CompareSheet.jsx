import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import Sheet from "./Sheet";
import { compareRows } from "../../lib/gallery";
import { optimizedImageUrl } from "../../lib/cloudinary";

/** Side-by-side facts for up to three saved properties. Best value per row is highlighted. */
export default function CompareSheet({ items, onClose }) {
  const rows = compareRows(items);
  const cols = { gridTemplateColumns: `5.5rem repeat(${items.length}, minmax(0, 1fr))` };
  return (
    <Sheet title="Compare properties" subtitle="Best value in each row is highlighted" onClose={onClose} wide>
      <div className="grid gap-x-2 items-start" style={cols}>
        <span />
        {items.map((l) => (
          <Link key={l.id} to={`/gallery/${l.id}`} className="block min-w-0">
            <span className="block aspect-[4/3] rounded-xl overflow-hidden bg-ink-dark">
              {l.images[0] && <img src={optimizedImageUrl(l.images[0], 360)} alt="" className="w-full h-full object-cover" />}
            </span>
            <span className="block mt-1.5 text-[12.5px] font-bold text-ink leading-tight line-clamp-2">{l.title}</span>
          </Link>
        ))}
      </div>
      <div className="mt-3">
        {rows.map((r) => (
          <div key={r.label} className="grid gap-x-2 py-2.5 border-t border-ink/[0.07] items-center" style={cols}>
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-ink/45">{r.label}</span>
            {r.cells.map((c, i) => (
              <span key={i} className={`text-[12.5px] sm:text-[13.5px] leading-snug min-w-0 break-words rounded-lg px-1.5 py-1 ${r.best === i ? "bg-[#F6EEDB] text-[#6B4C14] font-bold" : "text-ink/80 font-medium"}`}>
                {r.best === i && <Trophy size={11} className="inline -mt-0.5 mr-1 text-[#A8782A]" />}
                {c}
              </span>
            ))}
          </div>
        ))}
      </div>
    </Sheet>
  );
}
