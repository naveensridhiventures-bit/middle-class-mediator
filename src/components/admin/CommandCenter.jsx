import { useMemo, useState } from "react";
import { RefreshCw, ArrowRight, TrendingUp, TrendingDown, Minus, Flame, CalendarClock, Users, IndianRupee, Sparkles, Lightbulb } from "lucide-react";
import CountUp from "../gallery/CountUp";
import { computeOverview, greeting, dueLabel, formatINR, gapInsights } from "../../lib/insights";
import { ROLE_META } from "../../lib/roles";
import { Panel, ScoreRing, RolePill, WhatsAppMenu, CallButton, SkeletonBlock, EmptyNote } from "./insightUi";
import { btnDark } from "./styles";

// ---------- small visuals ----------

function Sparkline({ values, color = "#C89B3C" }) {
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * 100, 28 - (v / max) * 24]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-8" aria-hidden="true">
      <path d={`${d} L100 30 L0 30 Z`} fill={color} opacity="0.12" />
      <path d={d} pathLength="1" className="mcm-spark" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Delta({ now, before }) {
  if (before === 0 && now === 0) return <span className="text-ink/45">no change</span>;
  const pct = before === 0 ? 100 : Math.round(((now - before) / before) * 100);
  const Icon = pct > 0 ? TrendingUp : pct < 0 ? TrendingDown : Minus;
  const color = pct > 0 ? "#1F7352" : pct < 0 ? "#B04336" : "#6B7A99";
  return (
    <span className="inline-flex items-center gap-1 font-semibold" style={{ color }}>
      <Icon size={13} />
      {pct > 0 ? "+" : ""}{pct}% vs last week
    </span>
  );
}

function KpiTile({ label, icon: Icon, color, children, sub, spark, onClick, delay = 0, alert = false }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`relative text-left rounded-3xl bg-surface border border-ink/10 p-4 sm:p-5 overflow-hidden mcm-rise ${onClick ? "hover:border-ink/30 hover:-translate-y-0.5 transition active:scale-[0.99]" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2">
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${alert ? "mcm-pulse" : ""}`} style={{ backgroundColor: `${color}1A`, color }}>
          <Icon size={16} strokeWidth={2.25} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink/55">{label}</span>
      </div>
      <p className="mt-3 font-display font-bold text-[2rem] leading-none text-ink tabular-nums">{children}</p>
      <p className="mt-2 text-[12px] text-ink/55 leading-snug">{sub}</p>
      {spark && <div className="mt-2 -mb-1">{spark}</div>}
    </Tag>
  );
}

// ---------- charts ----------

function IntakeChart({ days }) {
  const [sel, setSel] = useState(days.length - 1);
  const max = Math.max(1, ...days.map((d) => d.total));
  const cur = days[sel] || days[days.length - 1];
  const parts = ["seller", "buyer", "mediator"];
  const total = days.reduce((a, d) => a + d.total, 0);
  const best = days.reduce((a, d) => (d.total > a.total ? d : a), days[0]);
  return (
    <>
      <div className="flex items-end gap-1.5 h-52" role="img" aria-label="New leads per day for the last 14 days">
        {days.map((d, i) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setSel(i)}
            onMouseEnter={() => setSel(i)}
            className="group flex-1 h-full flex flex-col justify-end items-stretch min-w-0"
            aria-label={`${d.date.toDateString()}: ${d.total} new leads`}
          >
            <div
              className={`mcm-bar-stack w-full rounded-t-md overflow-hidden flex flex-col-reverse transition-opacity ${i === sel ? "opacity-100" : "opacity-55 group-hover:opacity-80"}`}
              style={{ height: `${(d.total / max) * 100}%`, minHeight: d.total ? 4 : 2, animationDelay: `${i * 35}ms`, backgroundColor: d.total ? undefined : "rgba(27,42,74,0.08)" }}
            >
              {parts.map((p) => d[p] > 0 && <div key={p} style={{ flex: d[p], backgroundColor: ROLE_META[p].color }} />)}
            </div>
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        {days.map((d, i) => (
          <span key={d.key} className={`flex-1 text-center text-[9px] ${i === sel ? "font-bold text-ink" : "text-ink/35"}`}>
            {i % 2 === days.length % 2 || i === sel ? d.date.getDate() : ""}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[13px] text-ink/70">
          <span className="font-semibold text-ink">{cur.date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</span>
          {" · "}
          {cur.total === 0 ? "no new leads" : parts.filter((p) => cur[p]).map((p) => `${cur[p]} ${ROLE_META[p].label.toLowerCase()}${cur[p] > 1 ? "s" : ""}`).join(", ")}
        </p>
        <div className="flex items-center gap-3 text-[11px] text-ink/55">
          {parts.map((p) => (
            <span key={p} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: ROLE_META[p].color }} />
              {ROLE_META[p].plural}
            </span>
          ))}
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-ink/10 pt-4">
        {[
          ["14-day total", total],
          ["Daily average", (total / days.length).toFixed(1)],
          ["Best day", best.total ? `${best.date.toLocaleDateString(undefined, { day: "numeric", month: "short" })} · ${best.total}` : "—"],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-[10.5px] font-bold uppercase tracking-wider text-ink/45">{k}</dt>
            <dd className="font-display font-bold text-[1.15rem] text-ink mt-0.5 tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function Funnel({ role, rows, delay }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const total = rows.reduce((a, r) => a + r.count, 0);
  const color = ROLE_META[role].color;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color }}>{ROLE_META[role].plural}</span>
        <span className="text-[11px] text-ink/45">{total} total</span>
      </div>
      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <div key={r.label} className="flex items-center gap-2.5">
            <span className="w-24 shrink-0 text-[12px] text-ink/65 truncate">{r.label}</span>
            <div className="flex-1 h-5 rounded-full bg-ink/[0.05] overflow-hidden">
              <div
                className="mcm-hbar h-full rounded-full"
                style={{ width: `${(r.count / max) * 100}%`, minWidth: r.count ? 8 : 0, backgroundColor: color, opacity: 1 - i * 0.12, animationDelay: `${delay + i * 70}ms` }}
              />
            </div>
            <span className="w-6 text-right text-[12px] font-bold tabular-nums text-ink">{r.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DemandSupply({ overview }) {
  const [view, setView] = useState("types");
  const views = {
    types: { label: "Property type", rows: overview.types, noun: "type" },
    budgets: { label: "Budget", rows: overview.budgets, noun: "budget band" },
    regions: { label: "Area", rows: overview.regions, noun: "area" },
  };
  const cur = views[view];
  const max = Math.max(1, ...cur.rows.flatMap((r) => [r.demand, r.supply]));
  const insights = gapInsights(cur.rows, cur.noun);
  return (
    <>
      <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar" role="tablist" aria-label="Compare by">
        {Object.entries(views).map(([k, v]) => (
          <button
            key={k}
            role="tab"
            aria-selected={view === k}
            onClick={() => setView(k)}
            className={`shrink-0 h-8 px-3.5 rounded-full text-[12px] font-semibold border transition-colors ${view === k ? "bg-ink text-white border-ink" : "border-ink/15 text-ink/65 hover:border-ink/40"}`}
          >
            {v.label}
          </button>
        ))}
      </div>
      {cur.rows.length === 0 ? (
        <EmptyNote title="Not enough data yet" text="Add a few buyer and seller leads and the gaps show up here." />
      ) : (
        <div className="space-y-3" key={view}>
          {cur.rows.map((r, i) => (
            <div key={r.label}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[12.5px] font-semibold text-ink truncate">{r.label}</span>
                <span className="text-[11px] text-ink/50 shrink-0 tabular-nums">
                  <b style={{ color: ROLE_META.buyer.color }}>{r.demand}</b> {r.demand === 1 ? "buyer" : "buyers"} · <b style={{ color: ROLE_META.seller.color }}>{r.supply}</b> {r.supply === 1 ? "seller" : "sellers"}
                </span>
              </div>
              <div className="mt-1 space-y-1">
                {[["demand", ROLE_META.buyer.color], ["supply", ROLE_META.seller.color]].map(([k, c], j) => (
                  <div key={k} className="h-2 rounded-full bg-ink/[0.05] overflow-hidden">
                    <div className="mcm-hbar h-full rounded-full" style={{ width: `${(r[k] / max) * 100}%`, backgroundColor: c, animationDelay: `${i * 60 + j * 40}ms` }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {insights.length > 0 && (
        <div className="mt-5 space-y-2">
          {insights.map((x) => (
            <p key={x.text} className={`flex gap-2 rounded-2xl px-3.5 py-3 text-[12.5px] leading-snug ${x.tone === "warn" ? "bg-gold/15 text-[#7A5B16]" : "bg-teal/10 text-[#1F6F5C]"}`}>
              <Lightbulb size={15} className="shrink-0 mt-0.5" />
              {x.text}
            </p>
          ))}
        </div>
      )}
    </>
  );
}

// ---------- lists ----------

function PersonRow({ role, lead, score, line, adminName }) {
  return (
    <li className="rounded-2xl border border-ink/10 bg-white/60 p-3.5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <ScoreRing score={score.score} color={score.color} label={score.reasons.map((r) => `+${r.pts} ${r.why}`).join("\n")} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 min-w-0">
            <span className="font-display font-bold text-[15px] text-ink truncate">{lead.name}</span>
            <RolePill role={role} />
          </p>
          <p className="text-[12px] text-ink/55 truncate">{line}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <WhatsAppMenu role={role} lead={lead} adminName={adminName} compact />
        <CallButton phone={lead.phone} compact />
      </div>
    </li>
  );
}

// ---------- main ----------

export default function CommandCenter({ data, loading, error, refresh, refreshing, updatedAt, adminName, statusesByRole, onNavigate }) {
  const overview = useMemo(() => (loading ? null : computeOverview(data, statusesByRole)), [data, loading, statusesByRole]);

  if (loading && !error) {
    return (
      <div className="space-y-4">
        <SkeletonBlock className="h-44" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonBlock key={i} className="h-36" />)}
        </div>
        <SkeletonBlock className="h-64" />
      </div>
    );
  }
  if (!overview) return <p className="alert-error">{error}</p>;

  const o = overview;
  const first = (adminName || "").trim().split(/\s+/)[0];
  const sparkVals = o.intake.map((d) => d.total);
  const urgent = o.overdue + o.dueToday;
  const headline = o.overdue
    ? `${o.overdue} follow-up${o.overdue > 1 ? "s are" : " is"} overdue${o.dueToday ? ` and ${o.dueToday} more due today` : ""}. Clear those first — they're the deals most likely to slip.`
    : o.dueToday
      ? `${o.dueToday} follow-up${o.dueToday > 1 ? "s" : ""} due today. Everything older is already handled.`
      : "No follow-ups are due today. A good moment to line up new matches or add sellers.";

  return (
    <div className="space-y-4">
      {error && <p className="alert-error">{error}</p>}

      {/* Hero */}
      <section className="mcm-hero mcm-grain mcm-sheen relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white mcm-rise">
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-gold-light font-semibold">
              {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <button
              onClick={refresh}
              disabled={refreshing}
              className="h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60"
              aria-label="Refresh data"
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              {updatedAt ? updatedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "Refresh"}
            </button>
          </div>
          <h2 className="font-display font-bold text-[1.9rem] sm:text-[2.5rem] leading-[1.1] mt-3">
            {greeting()}{first ? `, ${first}` : ""}.
          </h2>
          <p className="mt-3 text-white/75 max-w-xl text-[14.5px] leading-relaxed">{headline}</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button onClick={() => onNavigate("today")} className="h-11 px-5 rounded-full bg-gold text-ink text-[12px] font-bold uppercase tracking-[0.12em] flex items-center gap-2 hover:bg-gold-light transition active:scale-[0.99]">
              Open today's queue{urgent ? ` (${urgent})` : ""} <ArrowRight size={14} />
            </button>
            {o.matchedBuyers > 0 && (
              <button onClick={() => onNavigate("matches")} className="h-11 px-5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[12px] font-bold uppercase tracking-[0.12em] flex items-center gap-2 transition">
                <Sparkles size={14} /> {o.matchedBuyers} ready match{o.matchedBuyers > 1 ? "es" : ""}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiTile label="Total leads" icon={Users} color="#3F5F8F" delay={60}
          sub={`${o.totals.sellers} sellers · ${o.totals.buyers} buyers · ${o.totals.mediators} mediators`}
          spark={<Sparkline values={sparkVals} color="#3F5F8F" />}>
          <CountUp value={o.totals.all} />
        </KpiTile>
        <KpiTile label="New this week" icon={TrendingUp} color="#1F6F5C" delay={110}
          sub={<Delta now={o.newThisWeek} before={o.newLastWeek} />}>
          <CountUp value={o.newThisWeek} />
        </KpiTile>
        <KpiTile label="Hot leads" icon={Flame} color="#C4503F" delay={160}
          sub="Buyers & sellers scoring 70+ — worth a call today">
          <CountUp value={o.hotCount} />
        </KpiTile>
        <KpiTile label="Follow-ups due" icon={CalendarClock} color={o.overdue ? "#C4503F" : "#C89B3C"} delay={210} alert={o.overdue > 0}
          onClick={() => onNavigate("today")}
          sub={o.overdue ? <span className="font-semibold text-coral">{o.overdue} overdue · {o.dueToday} today</span> : o.dueToday ? `${o.dueToday} due today` : "All caught up"}>
          <CountUp value={urgent} />
        </KpiTile>
        <KpiTile label="Listings value" icon={IndianRupee} color="#789A8B" delay={260}
          sub={`Combined asking price of ${o.totals.sellers} seller lead${o.totals.sellers === 1 ? "" : "s"}`}>
          {formatINR(o.pipelineValue)}
        </KpiTile>
        <KpiTile label="Ready matches" icon={Sparkles} color="#7A5BB0" delay={310}
          onClick={() => onNavigate("matches")}
          sub="Buyers with a 70%+ property match right now">
          <CountUp value={o.matchedBuyers} />
        </KpiTile>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-5 gap-4">
        <Panel className="lg:col-span-3" title="Lead intake" subtitle="New registrations over the last 14 days" delay={120}>
          <IntakeChart days={o.intake} />
        </Panel>
        <Panel className="lg:col-span-2" title="Pipelines" subtitle="Where every lead sits right now" delay={170}>
          <div className="space-y-5">
            {["seller", "buyer", "mediator"].map((r, i) => (
              <Funnel key={r} role={r} rows={o.funnel[r]} delay={i * 120} />
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Demand vs supply" subtitle="What buyers are asking for against what sellers have listed" delay={200}>
        <DemandSupply overview={o} />
      </Panel>

      {/* Action lists */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel
          title="Hottest leads"
          subtitle="Highest score — urgency, priority, budget and recent activity"
          delay={230}
          right={<span className="text-[11px] font-bold text-coral flex items-center gap-1"><Flame size={13} />{o.hotCount}</span>}
        >
          {o.hot.length === 0 ? (
            <EmptyNote title="No hot leads yet" text="Leads move here as they get priority stars, a budget, a near timeline and fresh activity." />
          ) : (
            <ul className="space-y-2.5">
              {o.hot.slice(0, 4).map((x) => (
                <PersonRow
                  key={`${x.role}-${x.l.id}`}
                  role={x.role}
                  lead={x.l}
                  score={x.s}
                  adminName={adminName}
                  line={x.s.reasons.slice(0, 2).map((r) => r.why).join(" · ")}
                />
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Needs you today"
          subtitle="Overdue and due-today follow-ups"
          delay={260}
          right={<button onClick={() => onNavigate("today")} className="text-[12px] font-bold text-ink/70 hover:text-ink flex items-center gap-1">All <ArrowRight size={13} /></button>}
        >
          {o.tasks.filter((t) => t.bucket === "overdue" || t.bucket === "today").length === 0 ? (
            <EmptyNote title="You're all caught up" text="Nothing is overdue or due today. Schedule a next follow-up on your warm leads so none go cold." />
          ) : (
            <ul className="space-y-2.5">
              {o.tasks.filter((t) => t.bucket === "overdue" || t.bucket === "today").slice(0, 4).map((t) => (
                <PersonRow key={t.key} role={t.role} lead={t.lead} score={t.score} adminName={adminName} line={dueLabel(t.diff)} />
              ))}
            </ul>
          )}
          <button onClick={() => onNavigate("today")} className={`${btnDark} w-full mt-4`}>
            Open full queue <ArrowRight size={14} />
          </button>
        </Panel>
      </div>
    </div>
  );
}
