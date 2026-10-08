import { useMemo, useState } from "react";
import { Check, ChevronDown, Clock, PartyPopper, RefreshCw, Phone } from "lucide-react";
import { buildTasks, dueLabel, addDaysISO, getRemarks, daysSince, lastActivity } from "../../lib/insights";
import { adminUpdateLead, adminAddRemark } from "../../lib/api";
import { ROLE_META } from "../../lib/roles";
import { Panel, ScoreRing, RolePill, WhatsAppMenu, CallButton, SkeletonBlock, EmptyNote } from "./insightUi";
import { adminInputCls, btnDark } from "./styles";

const SHEET = { seller: "Sellers", buyer: "Buyers", mediator: "Mediators" };

const SECTIONS = [
  { key: "overdue", title: "Overdue", color: "#C4503F", hint: "Past their follow-up date — oldest first" },
  { key: "today", title: "Due today", color: "#C89B3C", hint: "Scheduled for today" },
  { key: "soon", title: "Coming up", color: "#3F5F8F", hint: "Due in the next 3 days" },
  { key: "needsDate", title: "Needs a follow-up date", color: "#789A8B", hint: "Hot, or going cold — with nothing scheduled" },
];

const SNOOZE = [
  { label: "Tomorrow", days: 1 },
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
];

function lastRemark(lead) {
  const list = getRemarks(lead);
  if (!list.length) return null;
  return [...list].sort((a, b) => new Date(b.at) - new Date(a.at))[0];
}

function TaskRow({ task, section, adminName, onSaved, password }) {
  const { role, lead, score } = task;
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const remark = lastRemark(lead);
  const idle = daysSince(lastActivity(lead));
  const fresh = !lead.status || lead.status === "New";

  async function save() {
    if (!date) {
      setError("Pick when to follow up next.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (note.trim()) await adminAddRemark(password, SHEET[role], lead.id, note.trim(), adminName);
      const patch = { followUpDate: date };
      if (fresh) patch.status = "Contacted";
      await adminUpdateLead(password, SHEET[role], lead.id, patch);
      onSaved(task.key);
    } catch (e) {
      setError(e.message || "Couldn't save — try again.");
      setSaving(false);
    }
  }

  return (
    <li className="rounded-2xl border border-ink/10 bg-surface overflow-hidden" style={{ borderLeft: `4px solid ${section.color}` }}>
      <div className="p-4 flex flex-col gap-3.5">
        <div className="flex items-start gap-3">
          <ScoreRing score={score.score} color={score.color} label={`${score.tier} lead\n` + score.reasons.map((r) => `+${r.pts} ${r.why}`).join("\n")} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-bold text-[15.5px] text-ink">{lead.name}</span>
              <RolePill role={role} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink/45">{lead.status || "New"}</span>
            </p>
            <p className="text-[12px] text-ink/55 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <Phone size={11} className="text-ink/35" />
              {lead.phone || "No phone yet"}
              <span className="text-ink/25">·</span>
              <Clock size={11} className="text-ink/35" />
              {Number.isFinite(idle) ? (idle === 0 ? "touched today" : `last touched ${idle}d ago`) : "never contacted"}
            </p>
          </div>
          <span
            className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: `${section.color}1F`, color: section.key === "today" ? "#8A6A1F" : section.color }}
          >
            {dueLabel(task.diff)}
          </span>
        </div>

        {remark && (
          <p className="text-[12.5px] text-ink/70 bg-[#F7F5F1] rounded-xl px-3 py-2 leading-snug line-clamp-2">
            <span className="font-semibold text-ink/50">{remark.by ? `${remark.by}: ` : "Note: "}</span>
            {remark.text}
          </p>
        )}

        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-stretch">
          <WhatsAppMenu role={role} lead={lead} adminName={adminName} compact />
          <CallButton phone={lead.phone} compact />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="h-10 px-4 rounded-full bg-ink text-white text-[12px] font-bold uppercase tracking-[0.1em] flex items-center gap-1.5 hover:bg-ink-light transition"
          >
            <Check size={14} /> <span className="hidden sm:inline">Log</span>
            <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink/10 bg-[#F7F5F1] p-4 space-y-3 mcm-pop">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="What happened? (optional — saved to the remarks history)"
            className={`${adminInputCls} resize-none`}
            aria-label="Follow-up note"
          />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink/55 mb-2">Next follow-up</p>
            <div className="flex flex-wrap gap-2">
              {SNOOZE.map((s) => {
                const v = addDaysISO(s.days);
                return (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setDate(v)}
                    className={`h-9 px-3.5 rounded-full text-[12px] font-semibold border transition-colors ${date === v ? "bg-ink text-white border-ink" : "bg-surface border-ink/15 text-ink/70 hover:border-ink/40"}`}
                  >
                    {s.label}
                  </button>
                );
              })}
              <input
                type="date"
                value={date}
                min={addDaysISO(0)}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 px-3 rounded-full text-[12px] border border-ink/15 bg-surface text-ink/80"
                aria-label="Pick a date"
              />
            </div>
          </div>
          {fresh && <p className="text-[11.5px] text-ink/50">This lead is still "New" — saving moves it to Contacted.</p>}
          {error && <p className="alert-error">{error}</p>}
          <button type="button" onClick={save} disabled={saving} className={`${btnDark} w-full`}>
            {saving ? "Saving…" : "Save & reschedule"}
          </button>
        </div>
      )}
    </li>
  );
}

export default function TodayBoard({ data, loading, error, refresh, refreshing, password, adminName }) {
  const [role, setRole] = useState("all");
  const [done, setDone] = useState([]);

  const tasks = useMemo(() => (loading ? [] : buildTasks(data)), [data, loading]);
  const visible = tasks.filter((t) => !done.includes(t.key) && (role === "all" || t.role === role));
  const doneCount = done.length;
  const remaining = tasks.filter((t) => !done.includes(t.key) && (t.bucket === "overdue" || t.bucket === "today")).length;
  const pct = doneCount + remaining === 0 ? 0 : Math.round((doneCount / (doneCount + remaining)) * 100);

  function handleSaved(key) {
    setDone((d) => [...d, key]);
    refresh();
  }

  if (loading && !error) {
    return (
      <div className="space-y-3">
        <SkeletonBlock className="h-24" />
        {[0, 1, 2].map((i) => <SkeletonBlock key={i} className="h-40" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="alert-error">{error}</p>}

      <Panel
        title="Today's follow-up queue"
        subtitle="Call, message and reschedule from one place — hottest leads first"
        right={
          <button onClick={refresh} disabled={refreshing} className="h-8 px-3 rounded-full bg-ink/5 hover:bg-ink/10 text-[11px] font-semibold text-ink/70 flex items-center gap-1.5" aria-label="Refresh queue">
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        }
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[12rem]">
            <div className="flex items-baseline justify-between text-[12px] mb-1.5">
              <span className="font-semibold text-ink">{doneCount} cleared this session</span>
              <span className="text-ink/50">{remaining} due or overdue left</span>
            </div>
            <div className="h-2.5 rounded-full bg-ink/[0.07] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-teal to-gold transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar" role="group" aria-label="Filter by role">
            {[["all", "All"], ["seller", "Sellers"], ["buyer", "Buyers"], ["mediator", "Mediators"]].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setRole(k)}
                className={`shrink-0 h-8 px-3.5 rounded-full text-[12px] font-semibold border transition-colors flex items-center gap-1.5 ${role === k ? "bg-ink text-white border-ink" : "border-ink/15 text-ink/65 hover:border-ink/40"}`}
              >
                {k !== "all" && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: role === k ? "#fff" : ROLE_META[k].color }} />}
                {l}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {visible.length === 0 ? (
        <div className="rounded-3xl bg-surface border border-ink/10 p-10 text-center mcm-rise">
          <span className="mx-auto w-14 h-14 rounded-2xl bg-teal/10 text-teal flex items-center justify-center"><PartyPopper size={26} /></span>
          <p className="font-display font-bold text-xl text-ink mt-4">{doneCount ? "Queue cleared. Nice work." : "Nothing to chase right now"}</p>
          <p className="text-sm text-ink/55 mt-1 max-w-sm mx-auto">
            {doneCount ? `You cleared ${doneCount} follow-up${doneCount > 1 ? "s" : ""} this session.` : "Set a follow-up date on any lead and it will appear here on the day."}
          </p>
        </div>
      ) : (
        SECTIONS.map((s) => {
          const rows = visible.filter((t) => t.bucket === s.key);
          if (!rows.length) return null;
          return (
            <section key={s.key} aria-label={s.title}>
              <div className="flex items-baseline gap-2.5 mb-2.5 px-1">
                <span className="w-2.5 h-2.5 rounded-full self-center" style={{ backgroundColor: s.color }} />
                <h3 className="font-display font-bold text-[1.05rem] text-ink">{s.title}</h3>
                <span className="text-[12px] font-bold text-ink/45">{rows.length}</span>
                <span className="text-[12px] text-ink/45 hidden sm:inline">· {s.hint}</span>
              </div>
              <ul className="grid lg:grid-cols-2 gap-3 items-start">
                {rows.map((t) => (
                  <TaskRow key={t.key} task={t} section={s} adminName={adminName} password={password} onSaved={handleSaved} />
                ))}
              </ul>
            </section>
          );
        })
      )}
      {visible.length === 0 && tasks.length === 0 && (
        <EmptyNote title="Tip" text="Open any lead, set “Next follow-up”, and it lands here automatically." />
      )}
    </div>
  );
}
