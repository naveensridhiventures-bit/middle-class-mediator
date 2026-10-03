import { LayoutGrid } from "lucide-react";
import { shortType } from "../../lib/gallery";
import { iconForType } from "./typeIcons";

/**
 * The dark strip of property-type tiles. The chosen tile turns navy with a
 * gold icon; the rest are light tiles that stand out on the dark strip.
 */
export default function CategoryStrip({ types, active, onChange }) {
  const tiles = [{ value: "All", label: "All", Icon: LayoutGrid }, ...types.map((t) => ({ value: t, label: shortType(t), Icon: iconForType(t) }))];
  return (
    <div className="rounded-3xl bg-ink-dark p-3 flex gap-2.5 overflow-x-auto no-scrollbar" role="group" aria-label="Filter by property type">
      {tiles.map(({ value, label, Icon }) => {
        const on = active === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            aria-pressed={on}
            data-active={on}
            className={`chip shrink-0 w-[4.7rem] min-h-[4.6rem] rounded-2xl flex flex-col items-center justify-center gap-1.5 px-1.5 py-2.5 transition-colors active:scale-95 ${
              on ? "bg-[#1E2D52] ring-1 ring-[#E6C173]/70 text-white" : "bg-[#F6F1E8] text-ink hover:bg-white"
            }`}
          >
            <Icon size={24} strokeWidth={1.7} className={`chip-ico ${on ? "text-[#E6C173]" : "text-ink/75"}`} />
            <span className="text-[11px] leading-tight font-semibold text-center line-clamp-2">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
