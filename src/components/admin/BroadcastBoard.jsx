import { useMemo, useRef, useState } from "react";
import {
  Send, Users, MessageSquareText, Filter, Check, Save, Trash2, Download,
  Copy, RotateCcw, ShieldAlert, Terminal, ChevronDown, Search, Phone, Monitor, Smartphone,
} from "lucide-react";
import {
  ROLES, SHEET, VARIABLES, STARTER_TEMPLATES, DEFAULT_FILTERS,
  allCandidates, applyFilters, dedupeByPhone, tally, areaOf, typeOf,
  renderMessage, unknownPlaceholders, waUrl, toCsv, toConsoleMessage, toConsoleNumbers,
  loadTemplates, saveTemplate, deleteTemplate, recentlySent, logSent, unlogSent,
  recordRun, loadRuns,
} from "../../lib/broadcast";
import { adminUpdateLead } from "../../lib/api";
import PcSender from "./PcSender";
import { downloadCsv } from "../../lib/exportCsv";
import { ROLE_META } from "../../lib/roles";
import { Chip } from "./ui";
import { Panel, RolePill, SkeletonBlock, EmptyNote } from "./insightUi";
import { adminInputCls, btnGreen, btnOutline, btnDark } from "./styles";

const ACCENT_GREEN = "#1E9E5A";
const PAGE = 60; // recipient rows rendered before "Show more"

function download(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const toggle = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

function StepTitle({ n, icon: Icon, children }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="w-7 h-7 rounded-full text-white text-[13px] font-bold flex items-center justify-center" style={{ backgroundColor: ACCENT_GREEN }}>
        {n}
      </span>
      <Icon size={17} className="text-ink/50" />
      {children}
    </span>
  );
}

export default function BroadcastBoard({ data, loading, error, refresh, adminName, password }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [moreOpen, setMoreOpen] = useState(false);
  const [template, setTemplate] = useState(STARTER_TEMPLATES[0].text);
  const [activeTpl, setActiveTpl] = useState(STARTER_TEMPLATES[0].id);
  const [customTpls, setCustomTpls] = useState(() => loadTemplates());
  const [tplName, setTplName] = useState("");
  const [override, setOverride] = useState(() => new Map()); // key → true/false (manual tick / untick)
  const [sent, setSent] = useState(() => new Set()); // keys opened in this session
  const [tick, setTick] = useState(0); // bumps when the send log changes
  const [markContacted, setMarkContacted] = useState(true);
  const [marked, setMarked] = useState(0);
  const [limit, setLimit] = useState(PAGE);
  const [mode, setMode] = useState("pc"); // "pc" = Dispatch Console sends | "manual" = tap-to-send
  const [runs, setRuns] = useState(() => loadRuns());
  const taRef = useRef(null);
  const runId = useRef(`run-${Date.now().toString(36)}`);
  const sentRef = useRef(new Set());

  const set = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setLimit(PAGE);
  };

  // ---------- audience ----------
  const cands = useMemo(() => allCandidates(data, filters.roles), [data, filters.roles]);
  const filtered = useMemo(() => applyFilters(cands, filters), [cands, filters]);
  const rows = useMemo(() => dedupeByPhone(filtered), [filtered]);
  const merged = filtered.length - rows.length;
  const noNumber = rows.filter((r) => !r.wa).length;

  const statusChips = useMemo(() => tally(cands, (c) => c.lead.status || "New", 20), [cands]);
  const areaChips = useMemo(() => tally(cands, (c) => areaOf(c.lead), 14), [cands]);
  const typeChips = useMemo(() => tally(cands, (c) => typeOf(c.lead), 12), [cands]);

  const roleCount = (r) => (data[r] || []).length;
  const everyone = filters.roles.length === ROLES.length;

  // ---------- who is ticked ----------
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recent = useMemo(() => recentlySent(template), [template, tick]);
  const isChecked = (r) => (override.has(r.key) ? override.get(r.key) && Boolean(r.wa) : Boolean(r.wa) && !recent.has(r.key));
  const queue = rows.filter(isChecked);
  const pending = queue.filter((r) => !sent.has(r.key));
  const doneCount = queue.length - pending.length;
  const earlier = rows.filter((r) => r.wa && recent.has(r.key) && !sent.has(r.key)).length;

  function setAll(on) {
    const m = new Map(override);
    rows.forEach((r) => m.set(r.key, on));
    setOverride(m);
  }

  // ---------- message ----------
  const preview = pending[0] || queue[0] || rows[0] || null;
  const previewText = renderMessage(template, preview?.lead || { name: "Ravi Kumar", area: "Ambattur", propertyType: "Apartment / Flat", budget: "₹30–50 Lakhs" }, adminName);
  const badTokens = unknownPlaceholders(template);

  function pickTemplate(t) {
    setActiveTpl(t.id);
    setTemplate(t.text);
  }

  function insertVar(key) {
    const el = taRef.current;
    const token = `{{${key}}}`;
    if (!el) {
      setTemplate((t) => t + token);
      return;
    }
    const a = el.selectionStart ?? template.length;
    const b = el.selectionEnd ?? template.length;
    const next = template.slice(0, a) + token + template.slice(b);
    setTemplate(next);
    setActiveTpl("");
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + token.length, a + token.length);
    });
  }

  function saveCurrent() {
    if (!template.trim()) return;
    setCustomTpls(saveTemplate(tplName || "My message", template));
    setTplName("");
  }

  // ---------- sending ----------
  function markSent(r) {
    sentRef.current = new Set(sentRef.current).add(r.key);
    setSent(sentRef.current);
    logSent(r.key, template);
    setTick((t) => t + 1);
    setRuns(
      recordRun({
        id: runId.current,
        at: new Date().toISOString(),
        preview: template.replace(/\s+/g, " ").slice(0, 70),
        audience: audienceLabel(),
        sent: sentRef.current.size,
        total: queue.length,
      })
    );
    if (markContacted && (r.lead.status || "New") === "New" && password) {
      adminUpdateLead(password, SHEET[r.role], r.lead.id, { status: "Contacted" })
        .then(() => setMarked((n) => n + 1))
        .catch(() => {});
    }
  }

  function sendOne(r) {
    window.open(waUrl(r.lead.phone, renderMessage(template, r.lead, adminName)), "_blank", "noopener");
    markSent(r);
  }

  function undoOne(r) {
    const next = new Set(sentRef.current);
    next.delete(r.key);
    sentRef.current = next;
    setSent(next);
    unlogSent(r.key, template);
    setTick((t) => t + 1);
  }

  function resetProgress() {
    rows.forEach((r) => unlogSent(r.key, template));
    sentRef.current = new Set();
    setSent(new Set());
    setOverride(new Map());
    setMarked(0);
    setTick((t) => t + 1);
    runId.current = `run-${Date.now().toString(36)}`;
  }

  function audienceLabel() {
    const who = everyone ? "Everyone" : filters.roles.map((r) => ROLE_META[r].plural).join(" + ");
    const bits = [who];
    if (filters.statuses.length) bits.push(filters.statuses.join("/"));
    if (filters.areas.length) bits.push(filters.areas.join("/"));
    return bits.join(" · ");
  }

  // ---------- hand-offs ----------
  const stamp = new Date().toISOString().slice(0, 10);
  function copyNumbers() {
    const text = queue.map((r) => r.lead.phone).join("\n");
    navigator.clipboard?.writeText(text).catch(() => window.prompt("Copy these numbers", text));
  }
  function exportCsv() {
    downloadCsv(`mcm-broadcast-${stamp}.csv`, toCsv(queue, template, adminName));
  }
  function exportConsole() {
    download("numbers.json", JSON.stringify(toConsoleNumbers(queue), null, 2), "application/json");
    setTimeout(() => download("message.txt", toConsoleMessage(template, adminName), "text/plain;charset=utf-8"), 250);
  }

  // ---------- render ----------
  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonBlock className="h-40" />
        <SkeletonBlock className="h-64" />
      </div>
    );
  }

  const shown = rows.slice(0, limit);
  const nextRow = pending[0];

  return (
    <div className="space-y-5" style={{ "--accent": ACCENT_GREEN }}>
      {error && <p className="text-[13px] text-coral bg-coral/10 rounded-xl px-4 py-3">{error}</p>}

      {/* ───────── 1 · Who ───────── */}
      <Panel
        title={<StepTitle n="1" icon={Users}>Who should get it?</StepTitle>}
        subtitle="Pick the people, then narrow them down with filters."
        right={
          <button type="button" onClick={() => { setFilters(DEFAULT_FILTERS); setOverride(new Map()); }} className="text-[12px] font-semibold text-ink/50 hover:text-ink flex items-center gap-1">
            <RotateCcw size={13} /> Reset
          </button>
        }
      >
        <div className="flex flex-wrap gap-2">
          <Chip active={everyone} onClick={() => set({ roles: everyone ? ["buyer"] : [...ROLES], statuses: [], areas: [], types: [] })} dot={ACCENT_GREEN}>
            Everyone · {ROLES.reduce((n, r) => n + roleCount(r), 0)}
          </Chip>
          {ROLES.map((r) => (
            <Chip
              key={r}
              active={filters.roles.includes(r) && !everyone}
              onClick={() => {
                const next = everyone ? [r] : toggle(filters.roles, r);
                set({ roles: next.length ? next : [r], statuses: [], areas: [], types: [] });
              }}
              dot={ROLE_META[r].color}
            >
              {ROLE_META[r].plural} · {roleCount(r)}
            </Chip>
          ))}
        </div>

        {statusChips.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50 mb-2">Stage</p>
            <div className="flex flex-wrap gap-2">
              {statusChips.map(([s, n]) => (
                <Chip key={s} active={filters.statuses.includes(s)} onClick={() => set({ statuses: toggle(filters.statuses, s) })}>
                  {s} · {n}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {areaChips.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50 mb-2">Area</p>
            <div className="flex flex-wrap gap-2">
              {areaChips.map(([a, n]) => (
                <Chip key={a} active={filters.areas.includes(a)} onClick={() => set({ areas: toggle(filters.areas, a) })}>
                  {a} · {n}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          className="mt-4 text-[13px] font-semibold text-ink/60 hover:text-ink flex items-center gap-1.5"
          aria-expanded={moreOpen}
        >
          <Filter size={14} /> More filters
          <ChevronDown size={15} className={`transition-transform ${moreOpen ? "rotate-180" : ""}`} />
        </button>

        {moreOpen && (
          <div className="mt-3 space-y-4 rounded-2xl bg-white border border-ink/10 p-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50 mb-2">Lead heat</p>
              <div className="flex flex-wrap gap-2">
                {["Hot", "Warm", "Cold"].map((h) => (
                  <Chip key={h} active={filters.heat.includes(h)} onClick={() => set({ heat: toggle(filters.heat, h) })}>
                    {h}
                  </Chip>
                ))}
              </div>
            </div>

            {typeChips.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50 mb-2">Property / category</p>
                <div className="flex flex-wrap gap-2">
                  {typeChips.map(([t, n]) => (
                    <Chip key={t} active={filters.types.includes(t)} onClick={() => set({ types: toggle(filters.types, t) })}>
                      {t} · {n}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-ink/50 mb-1.5">Registered</span>
                <select className={`${adminInputCls} appearance-none`} value={filters.addedWithin} onChange={(e) => set({ addedWithin: e.target.value })}>
                  <option value="all">Any time</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-ink/50 mb-1.5">Search</span>
                <span className="relative block">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
                  <input className={`${adminInputCls} !pl-10`} placeholder="Name, number, area…" value={filters.search} onChange={(e) => set({ search: e.target.value })} />
                </span>
              </label>
            </div>

            <label className="flex items-center gap-2.5 text-[13px] text-ink/75 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 accent-[color:var(--accent)]" checked={filters.hideClosed} onChange={(e) => set({ hideClosed: e.target.checked })} />
              Skip closed leads (Worthless, Dropped, Sold out…)
            </label>
          </div>
        )}

        <div className="mt-5 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1" style={{ backgroundColor: `${ACCENT_GREEN}14` }}>
          <span className="font-display font-bold text-[1.35rem] leading-none text-ink">{rows.length}</span>
          <span className="text-[13px] text-ink/70">
            {rows.length === 1 ? "person matches" : "people match"}
            {merged > 0 && ` · ${merged} duplicate${merged === 1 ? "" : "s"} merged`}
            {noNumber > 0 && ` · ${noNumber} without a valid number`}
          </span>
        </div>
      </Panel>

      {/* ───────── 2 · What ───────── */}
      <Panel title={<StepTitle n="2" icon={MessageSquareText}>What should it say?</StepTitle>} subtitle="Start from a template or write your own. Details are filled in for each person.">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
          {[...STARTER_TEMPLATES, ...customTpls].map((t) => {
            const custom = t.id.startsWith("t-");
            return (
              <span key={t.id} className="shrink-0 inline-flex items-center">
                <Chip active={activeTpl === t.id} onClick={() => pickTemplate(t)} className={custom ? "!rounded-r-none" : ""}>
                  {t.name}
                </Chip>
                {custom && (
                  <button
                    type="button"
                    aria-label={`Delete template ${t.name}`}
                    onClick={() => {
                      setCustomTpls(deleteTemplate(t.id));
                      if (activeTpl === t.id) setActiveTpl("");
                    }}
                    className="h-9 w-8 -ml-px rounded-r-full border border-ink/15 bg-surface text-ink/40 hover:text-coral flex items-center justify-center"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </span>
            );
          })}
        </div>

        <textarea
          ref={taRef}
          className={`${adminInputCls} mt-3 min-h-[150px] leading-relaxed`}
          value={template}
          onChange={(e) => { setTemplate(e.target.value); setActiveTpl(""); }}
          placeholder="Type your message…"
          aria-label="Message"
        />

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink/45 mr-1">Insert</span>
          {VARIABLES.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertVar(v.key)}
              title={v.label}
              className="h-7 px-2.5 rounded-full text-[12px] font-semibold bg-ink/[0.06] hover:bg-ink/[0.12] text-ink/75 transition-colors"
            >
              {v.label.length > 14 ? v.key.replace("_", " ") : v.label}
            </button>
          ))}
        </div>

        {badTokens.length > 0 && (
          <p className="mt-3 text-[12px] text-coral bg-coral/10 rounded-xl px-3 py-2">
            Unknown field{badTokens.length > 1 ? "s" : ""}: {badTokens.join(", ")} — {badTokens.length > 1 ? "they" : "it"} will be sent as typed.
          </p>
        )}

        <div className="mt-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50 mb-2">
            Preview {preview ? `· for ${preview.lead.name || "first person"}` : "· sample"}
          </p>
          <div className="rounded-2xl p-3 sm:p-4" style={{ backgroundColor: "#E7DFD3" }}>
            <div className="max-w-[92%] sm:max-w-[80%] ml-auto rounded-2xl rounded-tr-md bg-[#D9FDD3] px-3.5 py-2.5 shadow-sm">
              <p className="text-[14px] text-[#111B21] whitespace-pre-wrap break-words leading-snug">{previewText || "…"}</p>
              <p className="text-[10px] text-[#667781] text-right mt-1">{previewText.length} characters</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <input className={adminInputCls} placeholder="Name this message to save it" value={tplName} onChange={(e) => setTplName(e.target.value)} aria-label="Template name" />
          <button type="button" onClick={saveCurrent} disabled={!template.trim()} className={`${btnOutline} sm:w-44 shrink-0`}>
            <Save size={14} /> Save template
          </button>
        </div>
      </Panel>

      {/* ───────── 3 · Send ───────── */}
      <Panel
        title={<StepTitle n="3" icon={Send}>Send</StepTitle>}
        subtitle={mode === "pc" ? "Your Dispatch Console on the PC sends every message automatically." : "WhatsApp opens with the message ready for each person — you tap Send, then come back here."}
      >
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-ink/[0.06] p-1" role="tablist" aria-label="How to send">
          {[["pc", Monitor, "Auto-send from PC"], ["manual", Smartphone, "Tap to send"]].map(([k, Icon, label]) => (
            <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => setMode(k)}
              className={`h-10 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${mode === k ? "bg-white text-ink shadow-sm" : "text-ink/55 hover:text-ink"}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
        {mode === "pc" && (
          <>
            <PcSender queue={queue} template={template} adminName={adminName} password={password} audience={audienceLabel()} markContacted={markContacted} />
            <label className="mt-3 flex items-center gap-2.5 text-[13px] text-ink/75 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 accent-[color:var(--accent)]" checked={markContacted} onChange={(e) => setMarkContacted(e.target.checked)} />
              Move “New” leads to “Contacted” once they are sent
            </label>
            {earlier > 0 && (
              <p className="mt-2 text-[12px] text-ink/55">
                {earlier} {earlier === 1 ? "person already received" : "people already received"} this exact message this week, so they're unticked below.
              </p>
            )}
          </>
        )}
        {rows.length === 0 ? (
          <EmptyNote title="Nobody matches these filters" text="Loosen a filter above, or pick another group of people." />
        ) : (
          <>
            {queue.length > 40 && (
              <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-gold/15 border border-gold/30 px-4 py-3 text-[12.5px] text-ink/80 leading-snug">
                <ShieldAlert size={17} className="shrink-0 mt-0.5 text-gold-dark" />
                <span>
                  {queue.length} people is a big batch. WhatsApp can limit accounts that message many people quickly — send around 40 a day, only to people who contacted you, and spread them through the day.
                </span>
              </div>
            )}

            {mode === "manual" && (<>
            <div className="rounded-2xl border border-ink/10 bg-white p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="font-display font-bold text-[1.6rem] leading-none text-ink">
                    {doneCount}<span className="text-ink/35"> / {queue.length}</span>
                  </p>
                  <p className="text-[12px] text-ink/55 mt-1">opened in WhatsApp{marked > 0 ? ` · ${marked} marked Contacted` : ""}</p>
                </div>
                {doneCount > 0 && (
                  <button type="button" onClick={resetProgress} className="text-[12px] font-semibold text-ink/50 hover:text-ink flex items-center gap-1">
                    <RotateCcw size={13} /> Start over
                  </button>
                )}
              </div>
              <div className="mt-3 h-2 rounded-full bg-ink/[0.08] overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={doneCount}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${queue.length ? (doneCount / queue.length) * 100 : 0}%`, backgroundColor: ACCENT_GREEN }} />
              </div>

              <button type="button" onClick={() => nextRow && sendOne(nextRow)} disabled={!nextRow} className={`${btnGreen} w-full mt-4 !h-14 !text-[13px]`}>
                <Send size={17} />
                {nextRow ? `Send to ${nextRow.lead.name?.split(/\s+/)[0] || "next person"} · ${doneCount + 1} of ${queue.length}` : queue.length ? "All done 🎉" : "Tick at least one person"}
              </button>

              <label className="mt-3 flex items-center gap-2.5 text-[13px] text-ink/75 cursor-pointer select-none">
                <input type="checkbox" className="w-4 h-4 accent-[color:var(--accent)]" checked={markContacted} onChange={(e) => setMarkContacted(e.target.checked)} />
                Move “New” leads to “Contacted” after I send
              </label>
              {earlier > 0 && (
                <p className="mt-2 text-[12px] text-ink/55">
                  {earlier} {earlier === 1 ? "person already received" : "people already received"} this exact message this week, so they're unticked. Tick them below to send again.
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={copyNumbers} disabled={!queue.length} className={`${btnOutline} !h-10`}><Copy size={14} /> Copy numbers</button>
              <button type="button" onClick={exportCsv} disabled={!queue.length} className={`${btnOutline} !h-10`}><Download size={14} /> Download CSV</button>
              <button type="button" onClick={exportConsole} disabled={!queue.length} className={`${btnOutline} !h-10`} title="Downloads numbers.json and message.txt in the Adverzo Dispatch Console format">
                <Terminal size={14} /> Dispatch Console files
              </button>
            </div>
            </>)}

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50">Recipients · {queue.length} ticked</p>
              <div className="flex gap-3 text-[12px] font-semibold">
                <button type="button" className="text-ink/60 hover:text-ink" onClick={() => setAll(true)}>Tick all</button>
                <button type="button" className="text-ink/60 hover:text-ink" onClick={() => setAll(false)}>Untick all</button>
              </div>
            </div>

            <ul className="mt-2 divide-y divide-ink/[0.07] rounded-2xl border border-ink/10 bg-white overflow-hidden">
              {shown.map((r) => {
                const on = isChecked(r);
                const done = sent.has(r.key);
                const wasEarlier = !done && recent.has(r.key);
                return (
                  <li key={r.key} className={`flex items-center gap-3 px-3.5 py-3 ${done ? "bg-whatsapp/[0.07]" : ""}`}>
                    <input
                      type="checkbox"
                      aria-label={`Include ${r.lead.name || r.lead.phone}`}
                      className="w-5 h-5 shrink-0 accent-[color:var(--accent)]"
                      checked={on}
                      disabled={!r.wa}
                      onChange={(e) => setOverride(new Map(override).set(r.key, e.target.checked))}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-ink truncate flex items-center gap-2">
                        <span className="truncate">{r.lead.name || "Unnamed"}</span>
                        <RolePill role={r.role} />
                      </p>
                      <p className="text-[12px] text-ink/55 truncate flex items-center gap-1.5">
                        <Phone size={11} className="shrink-0" />
                        {r.lead.phone || "No number"}
                        {areaOf(r.lead) && <span className="truncate">· {areaOf(r.lead)}</span>}
                        <span className="shrink-0">· {r.lead.status || "New"}</span>
                      </p>
                    </div>
                    {!r.wa ? (
                      <span className="text-[11px] font-bold text-coral shrink-0">Invalid number</span>
                    ) : mode === "pc" ? null : done ? (
                      <button type="button" onClick={() => undoOne(r)} className="shrink-0 h-8 px-3 rounded-full text-[12px] font-bold text-whatsapp bg-whatsapp/10 flex items-center gap-1" title="Tap to undo">
                        <Check size={13} strokeWidth={3} /> Sent
                      </button>
                    ) : (
                      <span className="flex items-center gap-2 shrink-0">
                        {wasEarlier && <span className="hidden sm:inline text-[11px] font-semibold text-ink/45">Sent earlier</span>}
                        <button type="button" onClick={() => sendOne(r)} className="h-8 px-3 rounded-full text-[12px] font-bold border border-ink/20 text-ink hover:bg-ink/5 flex items-center gap-1">
                          <Send size={12} /> Send
                        </button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {rows.length > limit && (
              <button type="button" onClick={() => setLimit((l) => l + PAGE)} className={`${btnDark} w-full mt-3`}>
                Show {Math.min(PAGE, rows.length - limit)} more
              </button>
            )}
          </>
        )}
      </Panel>

      {/* ───────── History ───────── */}
      {runs.length > 0 && (
        <Panel title="Recent broadcasts" subtitle="Saved on this device.">
          <ul className="divide-y divide-ink/[0.07]">
            {runs.slice(0, 6).map((r) => (
              <li key={r.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink truncate">{r.preview}</p>
                  <p className="text-[12px] text-ink/50 truncate">
                    {r.audience} · {new Date(r.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                <span className="shrink-0 text-[12px] font-bold text-ink/70 bg-ink/[0.06] rounded-full px-2.5 py-1 flex items-center gap-1">
                  {r.sent} sent
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <p className="text-[11px] text-ink/40 text-center pb-2">
        <button type="button" onClick={refresh} className="underline underline-offset-2 hover:text-ink/70">Refresh leads</button> to pull in anyone who registered in the last few minutes.
      </p>
    </div>
  );
}
