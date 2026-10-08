/** Trust chips built from what the seller actually told us. */
export default function Highlights({ items }) {
  if (!items.length) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Highlights">
      {items.map(({ icon: Icon, text }, i) => (
        <li
          key={text}
          className="fade-up flex items-center gap-1.5 rounded-full bg-[#F6EEDB] text-[#6B4C14] ring-1 ring-[#C99A4A]/30 pl-2.5 pr-3 py-1.5 text-[12.5px] font-semibold"
          style={{ "--d": `${200 + i * 70}ms` }}
        >
          <Icon size={14} className="text-[#A8782A]" />
          {text}
        </li>
      ))}
    </ul>
  );
}
