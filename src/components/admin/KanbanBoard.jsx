import { useMemo, useState } from "react";
import { GripVertical, MapPin, ChevronRight, MessageCircle, Phone } from "lucide-react";
import { leadScore, isOverdue, parseDay, dayDiff, getRemarks } from "../../lib/insights";
import { whatsappLink, callLink } from "../../lib/whatsapp";
import { ScoreBadge } from "./insightUi";

function summaryLine(role, lead) {
  if (role === "seller") return [lead.propertyType, lead.propertyLocation || lead.area].filter(Boolean).join(" · ");
  if (role === "buyer") return [lead.propertyType, lead.budget].filter(Boolean).join(" · ");
  return [lead.profession, lead.workingArea].filter(Boolean).join(" · ");
}

function FollowChip({ role, lead }) {
  const d = parseDay(lead.followUpDate);
  if (!d) return null;
  const over = isOverdue(role, lead);
  const diff = dayDiff(d);
  const label = over ? `${-diff}d overdue` : diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return (
    <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${over ? "bg-coral/15 text-coral" : diff === 0 ? "bg-gold/20 text-[#8A6A1F]" : "bg-ink/5 text-ink/55"}`}>
      {label}
    </span>
  );
}

function KanbanCard({ role, lead, statuses, current, dragging, onDragStart, onDragEnd, onOpen, onMove }) {
  const score = leadScore(role, lead);
  const priority = Number(lead.priority) || 0;
  const remark = getRemarks(lead)[0];
  const hasPhone = Boolean(String(lead.phone || "").replace(/\D/g, ""));
  return (
    <article
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      onDragEnd={onDragEnd}
      className={`group rounded-2xl bg-surface border border-ink/10 p-3 shadow-[0_1px_0_rgba(27,42,74,0.04)] transition ${dragging ? "opacity-40 scale-[0.98]" : "hover:border-ink/25 hover:shadow-[0_8px_20px_-10px_rgba(27,42,74,0.35)] cursor-grab active:cursor-grabbing"}`}
    >
      <div className="flex items-start gap-1.5">
        <GripVertical size={14} className="mt-0.5 text-ink/20 group-hover:text-ink/45 shrink-0 hidden sm:block" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-[14px] leading-snug text-ink truncate">{lead.name}</p>
          <p className="text-[11.5px] text-ink/50 truncate mt-0.5">{summaryLine(role, lead) || `#${lead.id}`}</p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        <ScoreBadge result={score} />
        <FollowChip role={role} lead={lead} />
        {priority > 0 && <span className="text-[11px] text-gold font-bold">{"★".repeat(priority)}</span>}
      </div>

      {remark && <p className="mt-2.5 text-[12px] text-ink/60 leading-snug line-clamp-2">{remark.text}</p>}

      <div className="mt-3 flex items-center gap-1.5">
        <select
          value={current}
          onChange={(e) => onMove(lead.id, e.target.value)}
          aria-label={`Move ${lead.name} to another stage`}
          className="min-w-0 flex-1 h-8 rounded-full border border-ink/10 bg-[#F7F5F1] px-2.5 text-[11.5px] font-semibold text-ink/70 outline-none focus:border-[color:var(--accent)]"
        >
          {statuses.map((s) => <option key={s}>{s}</option>)}
        </select>
        {hasPhone && (
          <>
            <a href={whatsappLink(lead.phone, `Hi ${String(lead.name || "").split(" ")[0]}, following up.`)} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${lead.name}`} className="w-8 h-8 rounded-full bg-whatsapp text-white flex items-center justify-center shrink-0 hover:brightness-95">
              <MessageCircle size={14} />
            </a>
            <a href={callLink(lead.phone)} aria-label={`Call ${lead.name}`} className="w-8 h-8 rounded-full border border-ink/15 text-ink/70 flex items-center justify-center shrink-0 hover:bg-ink/5">
              <Phone size={13} />
            </a>
          </>
        )}
        <button type="button" onClick={() => onOpen(lead.id)} aria-label={`Open ${lead.name}`} className="w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center shrink-0 hover:bg-ink-light">
          <ChevronRight size={15} />
        </button>
      </div>
    </article>
  );
}

/**
 * Pipeline board: one column per stage. Drag a card to another column (desktop)
 * or use the stage dropdown on the card (works with a tap on phones).
 */
export default function KanbanBoard({ role, leads, statuses, styleFor, accent, onMove, onOpen }) {
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  const columns = useMemo(() => {
    const by = Object.fromEntries(statuses.map((s) => [s, []]));
    leads.forEach((l) => {
      const s = statuses.includes(l.status) ? l.status : statuses[0];
      by[s].push(l);
    });
    // Hottest first inside each column.
    statuses.forEach((s) => by[s].sort((a, b) => leadScore(role, b).score - leadScore(role, a).score));
    return by;
  }, [leads, statuses, role]);

  function handleDrop(e, status) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    setOverCol(null);
    setDragId(null);
    const lead = leads.find((l) => l.id === id);
    if (lead && (statuses.includes(lead.status) ? lead.status : statuses[0]) !== status) onMove(id, status);
  }

  return (
    <div className="-mx-5 px-5 overflow-x-auto no-scrollbar pb-3 snap-x" style={{ "--accent": accent }}>
      <div className="flex gap-3 min-w-min items-start">
        {statuses.map((s) => {
          const style = styleFor(s);
          const list = columns[s];
          const over = overCol === s && dragId;
          return (
            <section
              key={s}
              aria-label={`${s} stage`}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (overCol !== s) setOverCol(s); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOverCol(null); }}
              onDrop={(e) => handleDrop(e, s)}
              className={`snap-start shrink-0 w-[17.5rem] rounded-3xl p-2.5 transition-colors border-2 ${over ? "bg-ink/[0.07] border-dashed" : "bg-ink/[0.04] border-transparent"}`}
              style={over ? { borderColor: style.dot } : undefined}
            >
              <header className="flex items-center gap-2 px-1.5 pt-1 pb-3">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: style.dot }} />
                <h3 className="font-display font-bold text-[14px] text-ink truncate">{s}</h3>
                <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface text-ink/60 tabular-nums">{list.length}</span>
              </header>
              <div className="space-y-2.5 min-h-[5rem]">
                {list.map((lead) => (
                  <KanbanCard
                    key={lead.id}
                    role={role}
                    lead={lead}
                    statuses={statuses}
                    current={s}
                    dragging={dragId === lead.id}
                    onDragStart={(e, id) => { e.dataTransfer.setData("text/plain", id); e.dataTransfer.effectAllowed = "move"; setDragId(id); }}
                    onDragEnd={() => { setDragId(null); setOverCol(null); }}
                    onOpen={onOpen}
                    onMove={onMove}
                  />
                ))}
                {list.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-ink/15 px-3 py-6 text-center text-[12px] text-ink/40 flex items-center justify-center gap-1.5">
                    <MapPin size={12} className="opacity-0" />Drop a lead here
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
