import { useEffect, useState } from "react";
import { adminListMediators, adminListSellers, adminUpdateRemark } from "../../lib/api";
import { whatsappLink, callLink } from "../../lib/whatsapp";

const STATUSES = ["New", "Contacted", "In progress", "Closed", "Dropped"];

function LeadRow({ lead, sheet, password, onSaved }) {
  const [remarks, setRemarks] = useState(lead.remarks || "");
  const [status, setStatus] = useState(lead.status || "New");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await adminUpdateRemark(password, sheet, lead.id, remarks, status);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card-ledger p-4 sm:p-5 grid sm:grid-cols-[1fr,220px] gap-4">
      <div className="flex gap-3">
        {lead.imageUrl && (
          <img src={lead.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 border border-ink/10" />
        )}
        <div className="min-w-0">
          <p className="font-semibold text-ink text-sm">{lead.propertyTitle || lead.propertyType || "—"}</p>
          <p className="text-xs text-ink/50 font-mono mt-0.5">#{lead.id} · {lead.timestamp}</p>
          <p className="text-sm text-ink/70 mt-1">{lead.name} · {lead.phone}</p>
          {lead.instaRef && <p className="text-xs text-ink/50 mt-1 truncate">Insta: {lead.instaRef}</p>}
          {lead.location && <p className="text-xs text-ink/50">{lead.location} {lead.price && `· ${lead.price}`}</p>}
          {(lead.message || lead.details) && (
            <p className="text-xs text-ink/60 mt-1 leading-relaxed">{lead.message || lead.details}</p>
          )}
          <div className="flex gap-2 mt-2">
            <a href={whatsappLink(lead.phone, `Hi ${lead.name}, following up on ${lead.propertyTitle || lead.propertyType}`)} target="_blank" rel="noreferrer" className="btn-whatsapp !py-1.5 !px-3 text-xs">
              WhatsApp
            </a>
            <a href={callLink(lead.phone)} className="btn-ghost !py-1.5 !px-3 text-xs">Call</a>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <select className="field-input !py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <textarea
          className="field-input !py-2 text-sm min-h-[70px]"
          placeholder="Admin remarks (private)"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
        <button onClick={save} disabled={saving} className="btn-primary w-full !py-2 text-sm">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function LeadsTab({ type, password }) {
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState("");
  const sheet = type === "mediator" ? "Mediators" : "Sellers";

  function load() {
    const fetcher = type === "mediator" ? adminListMediators : adminListSellers;
    fetcher(password)
      .then((data) => setLeads([...data].reverse()))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    setLeads(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  if (error) return <p className="text-buyer text-sm">{error}</p>;
  if (leads === null) return <p className="text-ink/50 text-sm">Loading…</p>;
  if (leads.length === 0) return <p className="text-ink/50 text-sm">No {type} leads yet.</p>;

  return (
    <div className="space-y-4">
      {leads.map((lead) => (
        <LeadRow key={lead.id} lead={lead} sheet={sheet} password={password} onSaved={load} />
      ))}
    </div>
  );
}
