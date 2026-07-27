import { useEffect, useMemo, useState } from "react";
import { adminUpdateRemark } from "../../lib/api";
import { whatsappLink, callLink } from "../../lib/whatsapp";

const STATUSES = ["New", "Contacted", "In progress", "Closed", "Dropped"];

const STATUS_STYLE = {
  New: { dot: "bg-gold", ring: "ring-gold/30", bg: "bg-gold/10", text: "text-gold-dark" },
  Contacted: { dot: "bg-sky-500", ring: "ring-sky-500/30", bg: "bg-sky-500/10", text: "text-sky-700" },
  "In progress": { dot: "bg-violet-500", ring: "ring-violet-500/30", bg: "bg-violet-500/10", text: "text-violet-700" },
  Closed: { dot: "bg-emerald-500", ring: "ring-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-700" },
  Dropped: { dot: "bg-ink/30", ring: "ring-ink/15", bg: "bg-ink/5", text: "text-ink/50" },
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

function LeadCard({ lead, fields, accent, onChanged }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(lead.status || "New");
  const [remarks, setRemarks] = useState(lead.remarks || "");
  const [saving, setSaving] = useState(false);

  async function persist(nextStatus, nextRemarks) {
    setSaving(true);
    try {
      await onChanged(lead.id, nextRemarks, nextStatus);
    } finally {
      setSaving(false);
    }
  }

  function handleStatusChange(e) {
    const next = e.target.value;
    setStatus(next);
    persist(next, remarks);
  }

  function saveRemarks() {
    persist(status, remarks);
  }

  const sStyle = STATUS_STYLE[status] || STATUS_STYLE.New;

  return (
    <div
      className="card-ledger p-4 space-y-3 border-l-4"
      style={{ borderLeftColor: accent }}
    >
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

      <button
        onClick={() => setOpen((o) => !o)}
        className="text-[11px] font-semibold uppercase tracking-wide text-ink/40 hover:text-ink"
      >
        {open ? "Hide details ▲" : "View details ▼"}
      </button>

      <div className="flex gap-2">
        <a href={whatsappLink(lead.phone, `Hi ${lead.name}, following up on your registration`)} target="_blank" rel="noreferrer" className="btn-whatsapp !py-1.5 !px-3 text-xs flex-1">
          WhatsApp
        </a>
        <a href={callLink(lead.phone)} className="btn-ghost !py-1.5 !px-3 text-xs flex-1">Call</a>
      </div>

      <select
        className="field-input !py-2 text-xs"
        value={status}
        onChange={handleStatusChange}
        disabled={saving}
      >
        {STATUSES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>

      <div className="space-y-1.5">
        <textarea
          className="field-input !py-2 text-xs min-h-[54px]"
          placeholder="Private note…"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
        <button onClick={saveRemarks} disabled={saving} className="btn-ghost w-full !py-1.5 text-xs">
          {saving ? "Saving…" : "Save note"}
        </button>
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

  async function handleChanged(id, remarks, status) {
    await adminUpdateRemark(password, sheet, id, remarks, status);
    load();
  }

  const filtered = useMemo(() => {
    if (!leads) return [];
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      const matchesQuery =
        !q || l.name?.toLowerCase().includes(q) || String(l.phone || "").includes(q);
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

  if (error) return <p className="text-buyer text-sm">{error}</p>;

  return (
    <div className="space-y-5">
      {/* Header strip */}
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
        <div className="text-right">
          <p className="text-2xl font-display font-bold text-ink leading-none">{counts.All}</p>
          <p className="text-[11px] uppercase tracking-wide text-ink/40 font-semibold mt-0.5">Total leads</p>
        </div>
      </div>

      {/* Stat pills / status filter */}
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

      {/* Search */}
      <input
        className="field-input"
        placeholder="Search by name or phone…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* Leads */}
      {leads === null && <p className="text-ink/50 text-sm">Loading…</p>}
      {leads !== null && filtered.length === 0 && (
        <p className="text-ink/50 text-sm">No {label.toLowerCase()} leads match here yet.</p>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((lead) => (
          <LeadCard key={lead.id} lead={lead} fields={fields} accent={accent} onChanged={handleChanged} />
        ))}
      </div>
    </div>
  );
}
