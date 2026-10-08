import { useMemo, useState } from "react";
import { CalendarCheck, MessageCircle } from "lucide-react";
import Sheet from "./Sheet";
import { whatsappLink } from "../../lib/whatsapp";
import { ADMIN_WHATSAPP_NUMBER } from "../../lib/config";

const SLOTS = ["10 AM – 12 PM", "12 – 2 PM", "2 – 4 PM", "4 – 6 PM"];

/** Pick a day and time; sends a ready-written visit request on WhatsApp. */
export default function VisitSheet({ listing, onClose }) {
  const days = useMemo(() => {
    const out = [];
    const base = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      out.push({
        key: d.toISOString().slice(0, 10),
        dow: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short" }),
        num: d.getDate(),
        mon: d.toLocaleDateString("en-IN", { month: "short" }),
        long: d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }),
      });
    }
    return out;
  }, []);
  const [day, setDay] = useState(days[1].key);
  const [slot, setSlot] = useState(SLOTS[0]);
  const [name, setName] = useState("");
  const chosen = days.find((d) => d.key === day);

  const message = `Hi, I'd like to visit this property: ${listing.title}${listing.location ? ` (${listing.location})` : ""}${listing.price ? ` — ${listing.price}` : ""}${listing.refId ? `\nRef: ${listing.refId}` : ""}\n\nPreferred time: ${chosen.long}, ${slot}${name.trim() ? `\nName: ${name.trim()}` : ""}\n\nPlease confirm if this works.`;

  const pill = (on) =>
    `rounded-2xl border-2 text-center transition-colors active:scale-95 ${on ? "border-[#C99A4A] bg-[#F7EBD2] text-ink" : "border-transparent bg-[#F1ECE3] text-ink/75 hover:bg-[#EAE4D9]"}`;

  return (
    <Sheet title="Book a visit" subtitle={listing.title} onClose={onClose}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink/45 mb-2">Pick a day</p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1" role="radiogroup" aria-label="Day">
        {days.map((d) => (
          <button key={d.key} type="button" role="radio" aria-checked={day === d.key} onClick={() => setDay(d.key)} className={`${pill(day === d.key)} shrink-0 w-[4.4rem] py-2.5`}>
            <span className="block text-[11px] font-bold uppercase tracking-wide text-ink/55">{d.dow}</span>
            <span className="block font-display font-bold text-[1.35rem] leading-none mt-1">{d.num}</span>
            <span className="block text-[11px] text-ink/50 mt-1">{d.mon}</span>
          </button>
        ))}
      </div>

      <p className="text-[11px] font-bold uppercase tracking-wider text-ink/45 mt-5 mb-2">Pick a time</p>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Time">
        {SLOTS.map((s) => (
          <button key={s} type="button" role="radio" aria-checked={slot === s} onClick={() => setSlot(s)} className={`${pill(slot === s)} py-3 text-[13.5px] font-semibold`}>
            {s}
          </button>
        ))}
      </div>

      <label className="block mt-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink/45">Your name (optional)</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="So we know who to expect"
          className="mt-2 w-full h-12 rounded-2xl border border-ink/10 bg-white px-4 text-[15px] outline-none focus:border-[#98691F] focus:shadow-[0_0_0_3px_rgba(152,105,31,0.18)]"
        />
      </label>

      <a
        href={whatsappLink(ADMIN_WHATSAPP_NUMBER, message)}
        target="_blank"
        rel="noreferrer"
        onClick={onClose}
        className="mt-6 h-14 rounded-2xl bg-[#A8782A] hover:bg-[#946820] text-white font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition"
      >
        <MessageCircle size={19} /> Request {chosen.dow === "Today" || chosen.dow === "Tomorrow" ? chosen.dow.toLowerCase() : `${chosen.dow} ${chosen.num} ${chosen.mon}`}, {slot}
      </a>
      <p className="mt-3 text-[12px] text-ink/50 flex items-start gap-1.5 leading-snug">
        <CalendarCheck size={14} className="mt-0.5 shrink-0" />
        This opens WhatsApp with your request written for you. The visit is confirmed once we reply.
      </p>
    </Sheet>
  );
}
