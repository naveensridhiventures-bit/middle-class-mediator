import { useMemo, useState } from "react";
import { UserPlus, StickyNote, Footprints, Copy, PhoneOff, CalendarX, Download, ShieldCheck, Wallet } from "lucide-react";
import { commissionForecast, recentActivity, dataHealth, formatINR, timeAgo, leadsToCsv } from "../../lib/insights";
import { downloadCsv } from "../../lib/exportCsv";
import { ROLE_META } from "../../lib/roles";
import { Panel, RolePill, EmptyNote } from "./insightUi";

// ---------- Deal forecast ----------

function readPct() {
  try {
    const v = Number(localStorage.getItem("mcm_commission_pct"));
    return v > 0 && v <= 10 ? v : 2;
  } catch {
    return 2;
  }
}

export function DealForecast({ data, onOpenLead, className = "", delay = 0 }) {
  const [pct, setPct] = useState(readPct);
  const f = useMemo(() => commissionForecast(data, pct), [data, pct]);

  function change(v) {
    setPct(v);
    const n = Number(v);
    if (n > 0 && n <= 10) {
      try { localStorage.setItem("mcm_commission_pct", String(n)); } catch { /* storage may be unavailable */ }
    }
  }

  const share = f.potential ? Math.round((f.expected / f.potential) * 100) : 0;

  return (
    <Panel
      className={className}
      delay={delay}
      title="Deal forecast"
      subtitle="Estimated commission from live seller leads, weighted by lead score"
      right={
        <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink/50">
          Commission
          <span className="flex items-center rounded-full border border-ink/15 bg-[#F7F5F1] overflow-hidden">
            <input
              type="number"
              min="0.25"
              max="10"
              step="0.25"
              value={pct}
              onChange={(e) => change(e.target.value)}
              aria-label="Commission percentage"
              className="w-14 h-8 bg-transparent text-center text-[13px] font-bold text-ink outline-none"
            />
            <span className="pr-2.5 text-[12px] text-ink/50">%</span>
          </span>
        </label>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-ink text-white p-4 relative overflow-hidden">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/55">Expected</p>
          <p className="font-display font-bold text-[1.7rem] leading-none mt-2 tabular-nums">{formatINR(f.expected)}</p>
          <p className="text-[11.5px] text-white/55 mt-2">likely, given today's lead scores</p>
        </div>
        <div className="rounded-2xl bg-[#F7F5F1] p-4">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink/45">If everything sells</p>
          <p className="font-display font-bold text-[1.7rem] leading-none mt-2 text-ink tabular-nums">{formatINR(f.potential)}</p>
          <p className="text-[11.5px] text-ink/50 mt-2">{share}% of it looks realistic</p>
        </div>
      </div>

      {f.deals.length === 0 ? (
        <div className="mt-4"><EmptyNote title="No priced listings yet" text="Add an exact price or a price range to seller leads and the forecast fills in." /></div>
      ) : (
        <ul className="mt-4 space-y-2">
          {f.deals.slice(0, 5).map((d) => (
            <li key={d.lead.id}>
              <button
                type="button"
                onClick={() => onOpenLead("seller", d.lead.id)}
                className="w-full text-left rounded-2xl border border-ink/10 bg-white/60 px-3.5 py-3 hover:border-ink/30 transition-colors"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block font-semibold text-[13.5px] text-ink truncate">{d.lead.name}</span>
                    <span className="block text-[11.5px] text-ink/50 truncate">
                      {[d.lead.propertyType, d.lead.propertyLocation || d.lead.area].filter(Boolean).join(" · ")} · {formatINR(d.price)}
                    </span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="block font-display font-bold text-[14px] text-ink tabular-nums">{formatINR(d.expected)}</span>
                    <span className="block text-[10.5px] text-ink/45">{Math.round(d.prob * 100)}% likely</span>
                  </span>
                </span>
                <span className="mt-2 block h-1.5 rounded-full bg-ink/[0.06] overflow-hidden">
                  <span className="mcm-hbar block h-full rounded-full" style={{ width: `${Math.round(d.prob * 100)}%`, backgroundColor: d.score.color }} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[11px] text-ink/40 leading-snug flex items-start gap-1.5">
        <Wallet size={12} className="mt-0.5 shrink-0" />
        An estimate for planning, not a promise. Uses the seller's exact price, or the middle of their price range, times your commission rate.
      </p>
    </Panel>
  );
}

// ---------- Activity feed ----------

const KIND = {
  new: { Icon: UserPlus, tint: "#1F6F5C", label: "New lead" },
  remark: { Icon: StickyNote, tint: "#C89B3C", label: "Note" },
  visit: { Icon: Footprints, tint: "#3F5F8F", label: "Site visit" },
};

export function ActivityFeed({ data, onOpenLead, className = "", delay = 0 }) {
  const items = useMemo(() => recentActivity(data, 8), [data]);
  return (
    <Panel className={className} delay={delay} title="Recent activity" subtitle="Registrations, notes and site visits across every lead">
      {items.length === 0 ? (
        <EmptyNote title="Quiet so far" text="New leads, notes and visits show up here as they happen." />
      ) : (
        <ol className="relative space-y-1">
          <span className="absolute left-[17px] top-3 bottom-3 w-px bg-ink/10" aria-hidden="true" />
          {items.map((a, i) => {
            const k = KIND[a.kind];
            return (
              <li key={`${a.role}-${a.lead.id}-${a.kind}-${a.at}-${i}`} className="relative">
                <button type="button" onClick={() => onOpenLead(a.role, a.lead.id)} className="w-full text-left flex items-start gap-3 rounded-2xl px-1.5 py-2 hover:bg-ink/[0.04] transition-colors">
                  <span className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-4 ring-surface" style={{ backgroundColor: `${k.tint}1F`, color: k.tint }}>
                    <k.Icon size={14} />
                  </span>
                  <span className="min-w-0 flex-1 pt-0.5">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[13px] text-ink">{a.lead.name}</span>
                      <RolePill role={a.role} />
                      <span className="text-[11px] text-ink/40 ml-auto">{timeAgo(a.at)}</span>
                    </span>
                    <span className="block text-[12.5px] text-ink/60 leading-snug line-clamp-2 mt-0.5">
                      {a.kind === "new" ? `${k.label} registered` : a.text}
                      {a.by && a.kind !== "new" ? <span className="text-ink/35"> — {a.by}</span> : null}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}

// ---------- Data health + export ----------

function Stat({ icon: Icon, label, value, tone }) {
  const bad = value > 0;
  return (
    <div className="rounded-2xl bg-[#F7F5F1] p-4 flex items-center gap-3">
      <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bad ? `${tone}1F` : "rgba(31,111,92,0.12)", color: bad ? tone : "#1F6F5C" }}>
        <Icon size={18} />
      </span>
      <div>
        <p className="font-display font-bold text-[1.4rem] leading-none text-ink tabular-nums">{value}</p>
        <p className="text-[11.5px] text-ink/55 mt-1">{label}</p>
      </div>
    </div>
  );
}

export function DataHealth({ data, onOpenLead, className = "", delay = 0 }) {
  const h = useMemo(() => dataHealth(data), [data]);
  const real = h.duplicates.filter((d) => d.kind === "duplicate");
  const cross = h.duplicates.filter((d) => d.kind === "cross");
  const stamp = new Date().toISOString().slice(0, 10);

  function exportRole(role) {
    const list = data[role] || [];
    downloadCsv(`mcm-${role}s-${stamp}.csv`, leadsToCsv(role, list));
  }

  return (
    <Panel
      className={className}
      delay={delay}
      title="Data health & export"
      subtitle="Clean data makes every score, match and reminder more accurate"
      right={
        <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold" style={{ color: real.length ? "#B04336" : "#1F7352" }}>
          <ShieldCheck size={14} />
          {real.length ? "Needs attention" : "Looking good"}
        </span>
      }
    >
      <div className="grid sm:grid-cols-3 gap-3">
        <Stat icon={Copy} label="Duplicate phone numbers" value={real.length} tone="#C4503F" />
        <Stat icon={PhoneOff} label="Active leads without a phone" value={h.noPhone} tone="#C89B3C" />
        <Stat icon={CalendarX} label="Active leads with no follow-up date" value={h.noFollowUp} tone="#3F5F8F" />
      </div>

      {(real.length > 0 || cross.length > 0) && (
        <div className="mt-4 space-y-2">
          {[...real, ...cross].slice(0, 5).map((g) => (
            <div key={g.phone} className="rounded-2xl border border-ink/10 bg-white/60 px-3.5 py-3 flex items-center gap-3 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${g.kind === "duplicate" ? "bg-coral/15 text-coral" : "bg-steel/15 text-steel"}`}>
                {g.kind === "duplicate" ? "Duplicate" : "Same person"}
              </span>
              <span className="text-[13px] font-semibold text-ink tabular-nums">{g.phone}</span>
              <span className="flex flex-wrap gap-1.5 ml-auto">
                {g.items.map((it) => (
                  <button
                    key={`${it.role}-${it.lead.id}`}
                    type="button"
                    onClick={() => onOpenLead(it.role, it.lead.id)}
                    className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full text-white hover:brightness-110"
                    style={{ backgroundColor: ROLE_META[it.role].color }}
                  >
                    {it.lead.name} · {ROLE_META[it.role].label}
                  </button>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-ink/10 flex items-center gap-2.5 flex-wrap">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink/45 mr-1">Export CSV</span>
        {["seller", "buyer", "mediator"].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => exportRole(r)}
            disabled={!(data[r] || []).length}
            className="h-9 px-3.5 rounded-full border border-ink/15 text-[12px] font-semibold text-ink/75 hover:border-ink/40 hover:bg-ink/[0.03] disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 transition-colors"
          >
            <Download size={13} /> {ROLE_META[r].plural} <span className="text-ink/40">({(data[r] || []).length})</span>
          </button>
        ))}
        <span className="text-[11px] text-ink/40">Opens in Excel · includes lead score &amp; last note</span>
      </div>
    </Panel>
  );
}
