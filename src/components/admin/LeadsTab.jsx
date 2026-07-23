import { useEffect, useState } from "react";
import { adminListMediators, adminListSellers, adminListBuyers, adminUpdateRemark } from "../../lib/api";
import { whatsappLink, callLink } from "../../lib/whatsapp";

const STATUSES = ["New", "Contacted", "In progress", "Closed", "Dropped"];

const CONFIG = {
  mediator: {
    sheet: "Mediators",
    fetcher: adminListMediators,
    fields: [
      ["profession", "Profession"],
      ["workingArea", "Working area"],
      ["propertyCategory", "Category"],
      ["experience", "Experience"],
      ["dealType", "Deal type"],
      ["genuineLeads", "Genuine leads only"],
    ],
  },
  seller: {
    sheet: "Sellers",
    fetcher: adminListSellers,
    fields: [
      ["propertyType", "Property type"],
      ["propertyLocation", "Location"],
      ["propertyStatus", "Status"],
      ["expectedPrice", "Expected price"],
      ["ownership", "Ownership"],
      ["timeline", "Planning to sell"],
    ],
  },
  buyer: {
    sheet: "Buyers",
    fetcher: adminListBuyers,
    fields: [
      ["propertyType", "Property type"],
      ["purpose", "Purpose"],
      ["budget", "Budget"],
      ["preferredLocation", "Preferred location"],
      ["loanRequirement", "Loan requirement"],
      ["timeline", "Planning to buy"],
    ],
  },
};

function LeadRow({ lead, sheet, password, fields, onSaved }) {
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
      <div className="min-w-0">
        <p className="font-semibold text-ink text-sm">{lead.name}</p>
        <p className="text-xs text-ink/50 font-mono mt-0.5">#{lead.id} · {lead.timestamp}</p>
        <p className="text-sm text-ink/70 mt-1">{lead.phone}</p>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
          {fields.map(([key, label]) =>
            lead[key] ? (
              <p key={key} className="text-xs text-ink/60">
                <span className="text-ink/40">{label}:</span> {lead[key]}
              </p>
            ) : null
          )}
        </div>
        <div className="flex gap-2 mt-3">
          <a href={whatsappLink(lead.phone, `Hi ${lead.name}, following up on your registration`)} target="_blank" rel="noreferrer" className="btn-whatsapp !py-1.5 !px-3 text-xs">
            WhatsApp
          </a>
          <a href={callLink(lead.phone)} className="btn-ghost !py-1.5 !px-3 text-xs">Call</a>
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
  const { sheet, fetcher, fields } = CONFIG[type];

  function load() {
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
        <LeadRow key={lead.id} lead={lead} sheet={sheet} password={password} fields={fields} onSaved={load} />
      ))}
    </div>
  );
}
