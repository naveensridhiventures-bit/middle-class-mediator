import { useEffect, useMemo, useState } from "react";
import { adminUpdateLead, adminAddRemark } from "../../lib/api";
import { whatsappLink, callLink } from "../../lib/whatsapp";
import { downloadReport } from "../../lib/report";

const STATUSES = ["New", "Contacted", "In progress", "Closed", "Dropped"];

const STATUS_STYLE = {
  New: { dot: "bg-gold", bg: "bg-gold/10", text: "text-gold-dark" },
  Contacted: { dot: "bg-sky-500", bg: "bg-sky-500/10", text: "text-sky-700" },
  "In progress": { dot: "bg-violet-500", bg: "bg-violet-500/10", text: "text-violet-700" },
  Closed: { dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-700" },
  Dropped: { dot: "bg-ink/30", bg: "bg-ink/5", text: "text-ink/50" },
};

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function parseRemarksLog(lead) {
  let log = [];
  if (lead.remarksLog) {
    try {
      const parsed = JSON.parse(lead.remarksLog);
      if (Array.isArray(parsed)) log = parsed;
    } catch {
      // ignore malformed JSON, fall back below
    }
  }
  if (log.length === 0 && lead.remarks) {
    log = [{ text: lead.remarks, at: lead.timestamp }];
  }
  return [...log].sort((a, b) => new Date(b.at) - new Date(a.at));
}

function isOverdue(followUpDate) {
  if (!followUpDate) return false;
  const d = new Date(followUpDate);
  if (isNaN(d)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

function StarRating({ value, onChange, disabled }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-0.5">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n === value ? 0 : n)}
          className="text-lg leading-none disabled:opacity-50"
          style={{ color: n <= value ? "#C89B3C" : "#1B2A4A26" }}
          aria-label={`Set priority ${n}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function LeadCard({ lead, fields, accent, onChanged }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(lead.status || "New");
  const [priority, setPriority] = useState(Number(lead.priority) || 0);
  const [followUpDate, setFollowUpDate] = useState(lead.followUpDate || "");
  const [newRemark, setNewRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingRemark, setSavingRemark] = useState(false);

  const remarksLog = useMemo(() => parseRemarksLog(lead), [lead]);
  const overdue = isOverdue(followUpDate) && status !== "Closed" && status !== "Dropped";

  async function persistMeta(patch) {
    setSaving(true);
    try {
      await onChanged.updateMeta(lead.id, patch);
    } finally {
      setSaving(false);
    }
  }

  function handleStatusChange(e) {
    const next = e.target.value;
    setStatus(next);
    persistMeta({ status: next, priority, followUpDate });
  }

  function handlePriorityChange(next) {
    setPriority(next);
    persistMeta({ status, priority: next, followUpDate });
  }

  function handleFollowUpChange(e) {
    const next = e.target.value;
    setFollowUpDate(next);
    persistMeta({ status, priority, followUpDate: next });
  }

  async function handleAddRemark() {
    if (!newRemark.trim()) return;
    setSavingRemark(true);
    try {
      await onChanged.addRemark(lead.id, newRemark.trim());
      setNewRemark("");
    } finally {
      setSavingRemark(false);
    }
  }

  const sStyle = STATUS_STYLE[status] || STATUS_STYLE.New;

  return (
    <div className="card-ledger p-4 space-y-3 border-l-4" style={{ borderLeftColor: accent }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-ink text-sm truncate">{lead.name}</p>
          <p className="text-[11px] text-ink/40 font-mono mt-0.5">#{lead.id} · {timeAgo(lead.timestamp)}</p>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${sStyle.bg} ${sStyle.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sStyle.dot}`} />
          {status}
        </span>
      </div>

      <p className="text-sm text-ink/70">{lead.phone}</p>

      <div className="flex items-center justify-between">
        <StarRating value={priority} onChange={handlePriorityChange} disabled={saving} />
        {followUpDate && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${overdue ? "bg-buyer/15 text-buyer" : "bg-ink/5 text-ink/50"}`}>
            {overdue ? "Overdue · " : "Follow up "}
            {new Date(followUpDate).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
          </span>
        )}
      </div>

      {open && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1 border-t border-ink/5">
          {fields.map(([key, label]) =>
            lead[key] ? (
              <p key={key} className="text-xs text-ink/60 pt-1.5">
                <span className="text-ink/40">{label}:</span> {lead[key]}
              </p>
            ) : null
          )}
        </div>
      )}

      <button onClick={() => setOpen((o) => !o)} className="text-[11px] font-semibold uppercase tracking-wide text-ink/40 hover:text-ink">
        {open ? "Hide details ▲" : "View details ▼"}
      </button>

      <div className="flex gap-2">
        <a href={whatsappLink(lead.phone, `Hi ${lead.name}, following up on your registration`)} target="_blank" rel="noreferrer" className="btn-whatsapp !py-1.5 !px-3 text-xs flex-1">
          WhatsApp
        </a>
        <a href={callLink(lead.phone)} className="btn-ghost !py-1.5 !px-3 text-xs flex-1">Call</a>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold block mb-1">Status</label>
          <select className="field-input !py-2 text-xs" value={status} onChange={handleStatusChange} disabled={saving}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold block mb-1">Next follow-up</label>
          <input type="date" className="field-input !py-2 text-xs" value={followUpDate} onChange={handleFollowUpChange} disabled={saving} />
        </div>
      </div>

      <div className="space-y-2 pt-1 border-t border-ink/5">
        <p className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold">
          Remarks history {remarksLog.length > 0 && `(${remarksLog.length})`}
        </p>
        {remarksLog.length === 0 ? (
          <p className="text-xs text-ink/40 italic">No remarks logged yet.</p>
        ) : (
          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {remarksLog.map((r, i) => (
              <div key={i} className="text-xs bg-white/60 rounded-lg px-2.5 py-1.5">
                <p className="text-ink/40 text-[10px] font-mono mb-0.5">{formatDateTime(r.at)}</p>
                <p className="text-ink/75">{r.text}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-1.5">
          <input
            className="field-input !py-2 text-xs flex-1"
            placeholder="Log a call / update…"
            value={newRemark}
            onChange={(e) => setNewRemark(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddRemark()}
          />
          <button onClick={handleAddRemark} disabled={savingRemark || !newRemark.trim()} className="btn-primary !py-2 !px-3 text-xs">
            {savingRemark ? "…" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CRMBoard({ type, label, accent, sheet, fetcher, fields, password }) {
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");

  function load() {
    fetcher(password)
      .then((data) => setLeads([...data].reverse()))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    setLeads(null);
    setError("");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const onChanged = {
    updateMeta: async (id, patch) => {
      await adminUpdateLead(password, sheet, id, patch);
      load();
    },
    addRemark: async (id, text) => {
      await adminAddRemark(password, sheet, id, text);
      load();
    },
  };

  const filtered = useMemo(() => {
    if (!leads) return [];
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      const matchesQuery = !q || l.name?.toLowerCase().includes(q) || String(l.phone || "").includes(q);
      const matchesStatus = activeStatus === "All" || (l.status || "New") === activeStatus;
      return matchesQuery && matchesStatus;
    });
  }, [leads, query, activeStatus]);

  const counts = useMemo(() => {
    const c = { All: leads?.length || 0 };
    STATUSES.forEach((s) => {
      c[s] = leads ? leads.filter((l) => (l.status || "New") === s).length : 0;
    });
    return c;
  }, [leads]);

  function handleDownload() {
    downloadReport({
      roleLabel: label,
      accent,
      fields,
      leads: filtered,
      filterLabel: activeStatus === "All" ? "All leads" : activeStatus,
    });
  }

  if (error) return <p className="text-buyer text-sm">{error}</p>;

  return (
    <div className="space-y-5">
      <div className="card-ledger p-5 flex flex-wrap items-center gap-4 justify-between" style={{ background: `linear-gradient(135deg, ${accent}12, transparent)` }}>
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl flex items-center justify-center font-display font-bold text-lg text-white shadow-md" style={{ backgroundColor: accent }}>
            {label[0]}
          </span>
          <div>
            <p className="field-label mb-0.5">Lead pipeline</p>
            <h2 className="font-display font-semibold text-xl text-ink">{label} CRM</h2>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-display font-bold text-ink leading-none">{counts.All}</p>
            <p className="text-[11px] uppercase tracking-wide text-ink/40 font-semibold mt-0.5">Total leads</p>
          </div>
          <button onClick={handleDownload} disabled={!leads || filtered.length === 0} className="btn-primary !py-2.5 !px-4 text-xs whitespace-nowrap">
            Download report
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["All", ...STATUSES].map((s) => {
          const isActive = activeStatus === s;
          const sStyle = STATUS_STYLE[s];
          return (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
                isActive ? "bg-ink text-paper" : `${sStyle?.bg || "bg-white/60"} ${sStyle?.text || "text-ink/60"} border border-ink/10`
              }`}
            >
              {sStyle && <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-paper" : sStyle.dot}`} />}
              {s} <span className="opacity-60">({counts[s] ?? 0})</span>
            </button>
          );
        })}
      </div>

      <input className="field-input" placeholder="Search by name or phone…" value={query} onChange={(e) => setQuery(e.target.value)} />

      {leads === null && <p className="text-ink/50 text-sm">Loading…</p>}
      {leads !== null && filtered.length === 0 && (
        <p className="text-ink/50 text-sm">No {label.toLowerCase()} leads match here yet.</p>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((lead) => (
          <LeadCard key={lead.id} lead={lead} fields={fields} accent={accent} onChanged={onChanged} />
        ))}
      </div>
    </div>
  );
}
