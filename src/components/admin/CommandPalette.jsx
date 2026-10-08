import { useEffect, useMemo, useRef, useState } from "react";
import { Search, CornerDownLeft, ArrowRight, Zap } from "lucide-react";
import { searchLeads, leadScore } from "../../lib/insights";
import { RolePill } from "./insightUi";

/**
 * Ctrl/⌘+K launcher: jump to any tab, find any lead across Sellers, Buyers and
 * Mediators by name, phone, ID or area, or run a quick action.
 */
export default function CommandPalette({ open, onClose, data, tabs, actions, onGo, onOpenLead }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    const out = [];
    const leadHits = searchLeads(data, q, 7);
    leadHits.forEach((h) => out.push({ type: "lead", key: `${h.role}-${h.lead.id}`, ...h }));
    tabs
      .filter((t) => !term || t.label.toLowerCase().includes(term) || `go ${t.label}`.toLowerCase().includes(term))
      .forEach((t) => out.push({ type: "tab", key: `tab-${t.key}`, tab: t }));
    actions
      .filter((a) => !term || a.label.toLowerCase().includes(term))
      .forEach((a) => out.push({ type: "action", key: `act-${a.id}`, action: a }));
    return out;
  }, [q, data, tabs, actions]);

  useEffect(() => { setIdx(0); }, [q]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${idx}"]`)?.scrollIntoView({ block: "nearest" });
  }, [idx]);

  function run(item) {
    if (!item) return;
    onClose();
    if (item.type === "lead") onOpenLead(item.role, item.lead.id);
    else if (item.type === "tab") onGo(item.tab.key);
    else item.action.run();
  }

  // Window-level so Esc / arrows / Enter work even before the input has focus.
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(items.length - 1, i + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
      else if (e.key === "Enter" && e.target.tagName !== "BUTTON") { e.preventDefault(); run(items[idx]); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items, idx]);

  if (!open) return null;

  const groups = [
    ["lead", "Leads"],
    ["tab", "Go to"],
    ["action", "Actions"],
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search and commands">
      <button type="button" aria-label="Close search" onClick={onClose} className="absolute inset-0 bg-ink-dark/55 backdrop-blur-[3px] mcm-fade" />
      <div className="relative w-full max-w-xl rounded-3xl bg-surface border border-ink/10 shadow-[0_30px_80px_-20px_rgba(17,27,51,0.6)] overflow-hidden mcm-pop">
        <div className="flex items-center gap-3 px-5 border-b border-ink/10">
          <Search size={18} className="text-ink/40 shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search leads, or jump to a section…"
            aria-label="Search"
            className="flex-1 h-14 bg-transparent outline-none text-[15px] text-ink placeholder:text-ink/35"
          />
          <kbd className="hidden sm:block text-[10.5px] font-bold text-ink/45 border border-ink/15 rounded-md px-1.5 py-0.5">ESC</kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {items.length === 0 && <p className="px-4 py-10 text-center text-sm text-ink/50">Nothing matches “{q}”.</p>}
          {groups.map(([type, title]) => {
            const rows = items.map((it, i) => ({ it, i })).filter((r) => r.it.type === type);
            if (!rows.length) return null;
            return (
              <div key={type} className="mb-1">
                <p className="px-3 pt-2 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-ink/40">{title}</p>
                {rows.map(({ it, i }) => {
                  const on = i === idx;
                  return (
                    <button
                      key={it.key}
                      type="button"
                      data-idx={i}
                      onMouseEnter={() => setIdx(i)}
                      onClick={() => run(it)}
                      className={`w-full text-left rounded-2xl px-3 py-2.5 flex items-center gap-3 transition-colors ${on ? "bg-ink text-white" : "text-ink hover:bg-ink/5"}`}
                    >
                      {it.type === "lead" && (
                        <>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="font-semibold text-[14px] truncate">{it.lead.name}</span>
                              <RolePill role={it.role} />
                            </span>
                            <span className={`block text-[11.5px] truncate ${on ? "text-white/60" : "text-ink/50"}`}>
                              {[it.lead.phone, it.lead.propertyType || it.lead.profession, it.lead.propertyLocation || it.lead.area, it.lead.status].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${on ? "bg-white/15 text-white" : "bg-ink/5 text-ink/60"}`}>
                            {leadScore(it.role, it.lead).score}
                          </span>
                        </>
                      )}
                      {it.type === "tab" && (
                        <>
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: it.tab.color }} />
                          <span className="flex-1 text-[14px] font-semibold">{it.tab.label}</span>
                          <ArrowRight size={14} className={on ? "text-white/60" : "text-ink/30"} />
                        </>
                      )}
                      {it.type === "action" && (
                        <>
                          <Zap size={14} className={on ? "text-gold-light" : "text-gold"} />
                          <span className="flex-1 text-[14px] font-semibold">{it.action.label}</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 px-5 py-2.5 border-t border-ink/10 bg-[#F7F5F1] text-[11px] text-ink/45">
          <span className="flex items-center gap-1.5"><kbd className="border border-ink/15 rounded px-1">↑↓</kbd> move</span>
          <span className="flex items-center gap-1.5"><CornerDownLeft size={11} /> open</span>
          <span className="ml-auto hidden sm:block">Tip: search a phone number or area</span>
        </div>
      </div>
    </div>
  );
}
