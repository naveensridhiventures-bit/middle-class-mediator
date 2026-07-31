import { useEffect, useMemo, useState } from "react";
import { Clock, User, X, SlidersHorizontal, Pencil, Camera, MapPin } from "lucide-react";
import { adminUpdateLead, adminAddRemark, adminAddVisit, addSellerLead } from "../../lib/api";
import { whatsappLink, callLink } from "../../lib/whatsapp";
import { downloadReport } from "../../lib/report";
import { uploadImage } from "../../lib/cloudinary";

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

function formatRemarkDateTime(iso) {
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

function parseCustomFields(lead) {
  if (!lead.customFields) return {};
  try {
    const parsed = JSON.parse(lead.customFields);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function parseVisitLog(lead) {
  if (!lead.visitLog) return [];
  try {
    const parsed = JSON.parse(lead.visitLog);
    if (!Array.isArray(parsed)) return [];
    return [...parsed].sort((a, b) => new Date(b.at) - new Date(a.at));
  } catch {
    return [];
  }
}

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location isn't available on this device/browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("Couldn't get your location — check location permission for this site.")),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
}

// Free reverse-geocoding via OpenStreetMap Nominatim. Non-commercial, low-
// volume use only — if this app grows, swap in a paid geocoding provider.
async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Reverse geocoding failed");
  const data = await res.json();
  return data.display_name || "";
}

function isOverdue(followUpDate, status) {
  if (!followUpDate || status === "Closed" || status === "Dropped") return false;
  const d = new Date(followUpDate);
  if (isNaN(d)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

function StarRating({ value, onChange, disabled, size = "text-lg" }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-0.5">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled || !onChange}
          onClick={() => onChange && onChange(n === value ? 0 : n)}
          className={`${size} leading-none disabled:opacity-100`}
          style={{ color: n <= value ? "#C89B3C" : "#1B2A4A26" }}
          aria-label={`Set priority ${n}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ---------- Compact summary card ----------

function LeadCard({ lead, accent, onOpen }) {
  const status = lead.status || "New";
  const priority = Number(lead.priority) || 0;
  const overdue = isOverdue(lead.followUpDate, status);
  const sStyle = STATUS_STYLE[status] || STATUS_STYLE.New;
  const remarksLog = parseRemarksLog(lead);
  const customFields = parseCustomFields(lead);
  const latestRemark = remarksLog[0];
  const visitLog = parseVisitLog(lead);
  const latestVisit = visitLog[0];

  return (
    <div className="card-ledger overflow-hidden space-y-3 border-l-4" style={{ borderLeftColor: accent }}>
      {latestVisit?.photoUrl && (
        <div className="relative -mx-4 -mt-4 mb-1">
          <img src={latestVisit.photoUrl} alt="Field visit" className="w-full h-36 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3 text-white">
            <p className="text-[11px] font-semibold flex items-center gap-1">
              📷 Field visit · {formatRemarkDateTime(latestVisit.at)}
            </p>
            {latestVisit.address && <p className="text-[10px] text-white/80 truncate">{latestVisit.address}</p>}
          </div>
        </div>
      )}
      <div className="px-4 space-y-3" style={{ paddingTop: latestVisit?.photoUrl ? 0 : 16, paddingBottom: 16 }}>
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
        <StarRating value={priority} />
        {lead.followUpDate && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${overdue ? "bg-buyer/15 text-buyer" : "bg-ink/5 text-ink/50"}`}>
            {overdue ? "Overdue · " : "Follow up "}
            {new Date(lead.followUpDate).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
          </span>
        )}
      </div>

      {(lead.area || lead.budgetValue || lead.sqft || Object.keys(customFields).length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {lead.area && <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-ink/5 text-ink/60">📍 {lead.area}</span>}
          {lead.budgetValue && <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-ink/5 text-ink/60">₹ {Number(lead.budgetValue).toLocaleString()}</span>}
          {lead.sqft && <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-ink/5 text-ink/60">{Number(lead.sqft).toLocaleString()} sqft</span>}
          {Object.entries(customFields).map(([k, v]) => (
            <span key={k} className="text-[10px] font-semibold px-2 py-1 rounded-full bg-ink/5 text-ink/60">{k}: {v}</span>
          ))}
        </div>
      )}

      {latestRemark && (
        <div className="rounded-lg bg-ink/[0.035] px-2.5 py-2">
          <div className="flex items-center gap-1.5 text-[10px] text-ink/40 mb-0.5">
            <Clock size={10} strokeWidth={2.25} />
            {formatRemarkDateTime(latestRemark.at)}
            {latestRemark.by && <span className="font-semibold" style={{ color: accent }}>· {latestRemark.by}</span>}
          </div>
          <p className="text-xs text-ink/70 leading-snug line-clamp-2">{latestRemark.text}</p>
        </div>
      )}

      <div className="flex gap-2">
        <a href={whatsappLink(lead.phone, `Hi ${lead.name}, following up on your registration`)} target="_blank" rel="noreferrer" className="btn-whatsapp !py-1.5 !px-3 text-xs flex-1">
          WhatsApp
        </a>
        <a href={callLink(lead.phone)} className="btn-ghost !py-1.5 !px-3 text-xs flex-1">Call</a>
      </div>

      <button
        onClick={onOpen}
        className="w-full flex items-center justify-center gap-1.5 btn-primary !py-2 text-xs"
      >
        <Pencil size={12} strokeWidth={2.25} />
        View & edit full details
        {remarksLog.length > 0 && <span className="opacity-70">· {remarksLog.length} remark{remarksLog.length === 1 ? "" : "s"}</span>}
      </button>
      </div>
    </div>
  );
}

// ---------- Full detail / edit modal ----------

function LeadDetailModal({ lead, fields, accent, onClose, onSaveDetails, onAddRemark }) {
  const [form, setForm] = useState(() => ({
    name: lead.name || "",
    phone: lead.phone || "",
    status: lead.status || "New",
    priority: Number(lead.priority) || 0,
    followUpDate: lead.followUpDate || "",
    area: lead.area || "",
    budgetValue: lead.budgetValue || "",
    sqft: lead.sqft || "",
    ...Object.fromEntries(fields.map(([k]) => [k, lead[k] ?? ""])),
  }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [newRemark, setNewRemark] = useState("");
  const [savingRemark, setSavingRemark] = useState(false);
  const [remarkError, setRemarkError] = useState("");
  const [customFields, setCustomFields] = useState(() => parseCustomFields(lead));
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  const remarksLog = useMemo(() => parseRemarksLog(lead), [lead]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function updateCustomField(key, value) {
    setCustomFields((cf) => ({ ...cf, [key]: value }));
    setSaved(false);
  }

  function removeCustomField(key) {
    setCustomFields((cf) => {
      const next = { ...cf };
      delete next[key];
      return next;
    });
    setSaved(false);
  }

  function addCustomField() {
    const name = newFieldName.trim();
    if (!name) return;
    setCustomFields((cf) => ({ ...cf, [name]: newFieldValue.trim() }));
    setNewFieldName("");
    setNewFieldValue("");
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      await onSaveDetails(lead.id, { ...form, customFields: JSON.stringify(customFields) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err.message || "Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddRemark() {
    if (!newRemark.trim()) return;
    setSavingRemark(true);
    setRemarkError("");
    try {
      await onAddRemark(lead.id, newRemark.trim());
      setNewRemark("");
    } catch (err) {
      setRemarkError(err.message || "Couldn't save that remark.");
    } finally {
      setSavingRemark(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-paper rounded-3xl w-full max-w-2xl shadow-2xl my-6 sm:my-0 border-t-4"
        style={{ borderTopColor: accent }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 flex items-start justify-between gap-3 border-b border-ink/5">
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold block mb-1">Name</label>
              <input className="field-input !py-2 text-sm font-semibold" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold block mb-1">Phone</label>
              <input className="field-input !py-2 text-sm" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center hover:bg-ink/10">
            <X size={16} className="text-ink/60" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          {/* Pipeline controls */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink/40 font-semibold mb-2">Pipeline</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold block mb-1">Status</label>
                <select className="field-input !py-2 text-sm" value={form.status} onChange={(e) => set("status", e.target.value)}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold block mb-1">Next follow-up</label>
                <input type="date" className="field-input !py-2 text-sm" value={form.followUpDate} onChange={(e) => set("followUpDate", e.target.value)} />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold block mb-1">Priority</label>
              <StarRating value={form.priority} onChange={(v) => set("priority", v)} size="text-2xl" />
            </div>
          </div>

          {/* Submitted details */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink/40 font-semibold mb-2">Submitted details</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {fields.map(([key, label]) => (
                <div key={key}>
                  <label className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold block mb-1">{label}</label>
                  <input className="field-input !py-2 text-sm" value={form[key]} onChange={(e) => set(key, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          {/* Admin metadata for advanced filtering */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink/40 font-semibold mb-2">Area &amp; sizing (for advanced filters)</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold block mb-1">Area / locality</label>
                <input className="field-input !py-2 text-sm" placeholder="e.g. Ambattur" value={form.area} onChange={(e) => set("area", e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold block mb-1">Budget (₹)</label>
                <input type="number" className="field-input !py-2 text-sm" placeholder="e.g. 5000000" value={form.budgetValue} onChange={(e) => set("budgetValue", e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold block mb-1">Size (sqft)</label>
                <input type="number" className="field-input !py-2 text-sm" placeholder="e.g. 1200" value={form.sqft} onChange={(e) => set("sqft", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Custom fields — mediator can add any attribute they need; it becomes a filter facet automatically */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink/40 font-semibold mb-2">
              Custom fields {Object.keys(customFields).length > 0 && `(${Object.keys(customFields).length})`}
            </p>
            <p className="text-xs text-ink/40 mb-2">
              Add any attribute you need (e.g. "Facing", "Furnishing", "Amenity") — it'll automatically show up as a filter option across all leads.
            </p>
            {Object.keys(customFields).length > 0 && (
              <div className="space-y-2 mb-3">
                {Object.entries(customFields).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink/60 w-28 shrink-0 truncate">{key}</span>
                    <input
                      className="field-input !py-1.5 text-xs flex-1"
                      value={value}
                      onChange={(e) => updateCustomField(key, e.target.value)}
                    />
                    <button onClick={() => removeCustomField(key)} className="shrink-0 w-7 h-7 rounded-full bg-ink/5 flex items-center justify-center hover:bg-buyer/10">
                      <X size={13} className="text-ink/50" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                className="field-input !py-2 text-xs flex-1"
                placeholder="Field name (e.g. Facing)"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
              />
              <input
                className="field-input !py-2 text-xs flex-1"
                placeholder="Value (e.g. East)"
                value={newFieldValue}
                onChange={(e) => setNewFieldValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomField()}
              />
              <button onClick={addCustomField} disabled={!newFieldName.trim()} className="btn-ghost !py-2 !px-3 text-xs whitespace-nowrap">
                + Add
              </button>
            </div>
          </div>

          {/* Remarks history */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink/40 font-semibold mb-2">
              Remarks history {remarksLog.length > 0 && `(${remarksLog.length})`}
            </p>
            {remarksLog.length === 0 ? (
              <p className="text-xs text-ink/40 italic mb-2">No remarks logged yet.</p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1 mb-2">
                {remarksLog.map((r, i) => (
                  <div key={i} className="border-l-[3px] rounded-lg bg-white/70 px-3 py-2" style={{ borderLeftColor: accent }}>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink/45 mb-1">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} strokeWidth={2.25} />
                        {formatRemarkDateTime(r.at)}
                      </span>
                      {r.by && (
                        <span className="inline-flex items-center gap-1 font-semibold" style={{ color: accent }}>
                          <User size={11} strokeWidth={2.25} />
                          {r.by}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-ink/80 leading-snug">{r.text}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-1.5">
              <input
                className="field-input !py-2 text-sm flex-1"
                placeholder="Add a remark…"
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddRemark()}
              />
              <button onClick={handleAddRemark} disabled={savingRemark || !newRemark.trim()} className="btn-whatsapp !py-2 !px-4 text-sm whitespace-nowrap">
                {savingRemark ? "…" : "Save"}
              </button>
            </div>
            {remarkError && <p className="text-xs text-buyer mt-1.5">{remarkError}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-ink/5">
          {saveError && <p className="text-xs text-buyer mb-2">{saveError}</p>}
          <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 !py-3">
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
          </button>
          <button onClick={onClose} className="btn-ghost !py-3 !px-5">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- New field-visit lead (standalone — creates a brand new seller lead) ----------

function NewFieldVisitModal({ accent, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [error, setError] = useState("");

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
  }

  async function handleCaptureLocation() {
    setLocating(true);
    setError("");
    try {
      const loc = await getCurrentLocation();
      setCoords(loc);
      try {
        const auto = await reverseGeocode(loc.lat, loc.lng);
        if (auto) setAddress(auto);
      } catch {
        // reverse geocoding failed — coords are still captured, admin can type the address manually
      }
    } catch (err) {
      setError(err.message || "Couldn't get your location.");
    } finally {
      setLocating(false);
    }
  }

  async function handleCreate() {
    if (!photo) {
      setError("Take a photo first.");
      return;
    }
    if (!address.trim() && !coords) {
      setError("Capture your live location or type the address manually.");
      return;
    }
    setError("");
    setCreating(true);
    setUploadPct(0);
    try {
      const photoUrl = await uploadImage(photo, setUploadPct);
      await onCreate({
        name: name.trim() || "Field visit lead",
        phone: phone.trim(),
        photoUrl,
        lat: coords?.lat || "",
        lng: coords?.lng || "",
        address: address.trim(),
      });
    } catch (err) {
      setError(err.message || "Couldn't create this lead.");
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-paper rounded-3xl w-full max-w-md shadow-2xl my-6 sm:my-0 border-t-4"
        style={{ borderTopColor: accent }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6 flex items-center justify-between border-b border-ink/5">
          <h3 className="font-display font-semibold text-lg text-ink">New field visit lead</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center hover:bg-ink/10">
            <X size={16} className="text-ink/60" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs text-ink/50 leading-relaxed">
            Snap a photo on-site, capture your live location (or just type the address), and this
            creates a brand-new seller lead timestamped now. Fill in the rest of the details later
            from the lead's edit panel.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold block mb-1">Name (optional)</label>
              <input className="field-input !py-2 text-sm" placeholder="Customer name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold block mb-1">Phone (optional)</label>
              <input className="field-input !py-2 text-sm" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="btn-ghost !py-2.5 !px-4 text-sm cursor-pointer flex items-center gap-1.5 shrink-0">
              <Camera size={14} strokeWidth={2.25} />
              {photo ? "Retake photo" : "Take photo"}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
            </label>
            {photoPreview && <img src={photoPreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />}
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold block mb-1.5">Location &amp; address</label>
            <button
              onClick={handleCaptureLocation}
              disabled={locating}
              className="btn-ghost w-full !py-2.5 text-sm flex items-center justify-center gap-1.5 mb-2"
            >
              <MapPin size={14} strokeWidth={2.25} />
              {locating ? "Getting live location…" : coords ? "Re-capture live location" : "Capture live location"}
            </button>
            {coords && (
              <p className="text-[11px] text-ink/40 mb-2">
                📍 Captured: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
            )}
            <input
              className="field-input !py-2.5 text-sm"
              placeholder="Address (auto-filled after capture, or type manually)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-buyer">{error}</p>}

          <button onClick={handleCreate} disabled={!photo || creating} className="btn-primary w-full !py-3">
            {creating ? (uploadPct > 0 && uploadPct < 100 ? `Uploading photo… ${uploadPct}%` : "Creating lead…") : "Create lead from this visit"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Advanced filter panel ----------

function AdvancedFilters({ areas, selectedAreas, onToggleArea, budgetMin, budgetMax, setBudgetMin, setBudgetMax, sqftMin, sqftMax, setSqftMin, setSqftMax, facets, selectedFacets, onToggleFacetValue, onClear }) {
  const facetNames = Object.keys(facets);
  return (
    <div className="card-ledger p-4 space-y-4">
      {areas.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold mb-1.5">Area / locality</p>
          <div className="flex flex-wrap gap-1.5">
            {areas.map((a) => (
              <button
                key={a}
                onClick={() => onToggleArea(a)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  selectedAreas.includes(a) ? "bg-ink text-paper border-ink" : "bg-white/60 text-ink/60 border-ink/10"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold mb-1.5">Budget range (₹)</p>
          <div className="flex items-center gap-2">
            <input type="number" placeholder="Min" className="field-input !py-2 text-xs" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
            <span className="text-ink/30 text-xs">–</span>
            <input type="number" placeholder="Max" className="field-input !py-2 text-xs" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold mb-1.5">Size range (sqft)</p>
          <div className="flex items-center gap-2">
            <input type="number" placeholder="Min" className="field-input !py-2 text-xs" value={sqftMin} onChange={(e) => setSqftMin(e.target.value)} />
            <span className="text-ink/30 text-xs">–</span>
            <input type="number" placeholder="Max" className="field-input !py-2 text-xs" value={sqftMax} onChange={(e) => setSqftMax(e.target.value)} />
          </div>
        </div>
      </div>

      {facetNames.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-3 border-t border-ink/5">
          {facetNames.map((name) => (
            <div key={name}>
              <p className="text-[10px] uppercase tracking-wide text-ink/40 font-semibold mb-1.5">{name}</p>
              <div className="space-y-1">
                {Object.entries(facets[name]).map(([value, count]) => {
                  const checked = (selectedFacets[name] || []).includes(value);
                  return (
                    <label key={value} className="flex items-center gap-2 text-xs text-ink/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleFacetValue(name, value)}
                        className="accent-ink w-3.5 h-3.5"
                      />
                      <span className="flex-1 truncate">{value}</span>
                      <span className="text-ink/35">({count})</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={onClear} className="text-xs font-semibold text-ink/40 hover:text-ink">Clear advanced filters</button>
    </div>
  );
}

// ---------- Main board ----------

export default function CRMBoard({ type, label, accent, sheet, fetcher, fields, facetFields = [], password, adminName }) {
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");
  const [openLeadId, setOpenLeadId] = useState(null);
  const [showNewVisit, setShowNewVisit] = useState(false);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [sqftMin, setSqftMin] = useState("");
  const [sqftMax, setSqftMax] = useState("");
  const [selectedFacets, setSelectedFacets] = useState({});

  function load() {
    fetcher(password)
      .then((data) => setLeads([...data].reverse()))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    setLeads(null);
    setError("");
    setOpenLeadId(null);
    setSelectedAreas([]);
    setBudgetMin(""); setBudgetMax(""); setSqftMin(""); setSqftMax("");
    setSelectedFacets({});
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const onChanged = {
    updateMeta: async (id, patch) => {
      await adminUpdateLead(password, sheet, id, patch);
      load();
    },
    addRemark: async (id, text) => {
      await adminAddRemark(password, sheet, id, text, adminName);
      load();
    },
    addVisit: async (id, visit) => {
      await adminAddVisit(password, sheet, id, visit, adminName);
      load();
    },
  };

  const areaOptions = useMemo(() => {
    if (!leads) return [];
    const set = new Set(leads.map((l) => l.area).filter(Boolean));
    return [...set].sort();
  }, [leads]);

  const facets = useMemo(() => {
    if (!leads) return {};
    const result = {};

    // Built-in facets from known enumerated fields (e.g. Property type)
    facetFields.forEach(([key, facetLabel]) => {
      leads.forEach((l) => {
        const value = l[key];
        if (!value) return;
        if (!result[facetLabel]) result[facetLabel] = {};
        result[facetLabel][value] = (result[facetLabel][value] || 0) + 1;
      });
    });

    // Ad-hoc facets from custom fields the admin has tagged onto leads
    leads.forEach((l) => {
      const cf = parseCustomFields(l);
      Object.entries(cf).forEach(([name, value]) => {
        if (!value) return;
        if (!result[name]) result[name] = {};
        result[name][value] = (result[name][value] || 0) + 1;
      });
    });

    return result;
  }, [leads, facetFields]);

  // Maps a facet label to how to read that value off a lead — either a
  // known built-in field (propertyType, etc.) or an ad-hoc custom field.
  const facetKeyLookup = useMemo(() => {
    const map = {};
    facetFields.forEach(([key, facetLabel]) => {
      map[facetLabel] = { type: "field", key };
    });
    return map;
  }, [facetFields]);

  function getFacetValue(lead, facetName) {
    const known = facetKeyLookup[facetName];
    if (known) return lead[known.key];
    return parseCustomFields(lead)[facetName];
  }

  const facetActiveCount = Object.values(selectedFacets).reduce((sum, arr) => sum + arr.length, 0);

  const advancedActiveCount =
    selectedAreas.length + [budgetMin, budgetMax, sqftMin, sqftMax].filter((v) => v !== "").length + facetActiveCount;

  const filtered = useMemo(() => {
    if (!leads) return [];
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      const matchesQuery = !q || l.name?.toLowerCase().includes(q) || String(l.phone || "").includes(q);
      const matchesStatus = activeStatus === "All" || (l.status || "New") === activeStatus;
      const matchesArea = selectedAreas.length === 0 || selectedAreas.includes(l.area);
      const budget = Number(l.budgetValue);
      const matchesBudget =
        (!budgetMin && !budgetMax) ||
        (Number.isFinite(budget) &&
          (!budgetMin || budget >= Number(budgetMin)) &&
          (!budgetMax || budget <= Number(budgetMax)));
      const sqft = Number(l.sqft);
      const matchesSqft =
        (!sqftMin && !sqftMax) ||
        (Number.isFinite(sqft) &&
          (!sqftMin || sqft >= Number(sqftMin)) &&
          (!sqftMax || sqft <= Number(sqftMax)));
      const matchesFacets = Object.entries(selectedFacets).every(([name, values]) => {
        if (values.length === 0) return true;
        return values.includes(getFacetValue(l, name));
      });
      return matchesQuery && matchesStatus && matchesArea && matchesBudget && matchesSqft && matchesFacets;
    });
  }, [leads, query, activeStatus, selectedAreas, budgetMin, budgetMax, sqftMin, sqftMax, selectedFacets]);

  const counts = useMemo(() => {
    const c = { All: leads?.length || 0 };
    STATUSES.forEach((s) => {
      c[s] = leads ? leads.filter((l) => (l.status || "New") === s).length : 0;
    });
    return c;
  }, [leads]);

  const openLead = openLeadId ? leads?.find((l) => l.id === openLeadId) : null;

  function toggleArea(a) {
    setSelectedAreas((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  function toggleFacetValue(name, value) {
    setSelectedFacets((prev) => {
      const current = prev[name] || [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [name]: next };
    });
  }

  function clearAdvanced() {
    setSelectedAreas([]);
    setBudgetMin(""); setBudgetMax(""); setSqftMin(""); setSqftMax("");
    setSelectedFacets({});
  }

  function handleDownload() {
    downloadReport({
      roleLabel: label,
      accent,
      fields,
      leads: filtered,
      filterLabel: activeStatus === "All" ? "All leads" : activeStatus,
    });
  }

  async function handleCreateFieldVisit({ name, phone, photoUrl, lat, lng, address }) {
    const { id } = await addSellerLead({
      name,
      phone,
      propertyType: "",
      propertyLocation: address || "",
      propertyStatus: "",
      expectedPrice: "",
      ownership: "",
      timeline: "",
    });
    await adminAddVisit(password, sheet, id, { photoUrl, lat, lng, address }, adminName);
    setShowNewVisit(false);
    load();
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
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-display font-bold text-ink leading-none">{counts.All}</p>
            <p className="text-[11px] uppercase tracking-wide text-ink/40 font-semibold mt-0.5">Total leads</p>
          </div>
          {sheet === "Sellers" && (
            <button onClick={() => setShowNewVisit(true)} className="btn-whatsapp !py-2.5 !px-4 text-xs whitespace-nowrap flex items-center gap-1.5">
              <Camera size={13} strokeWidth={2.25} />
              New field visit
            </button>
          )}
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

      <div className="flex gap-2">
        <input className="field-input flex-1" placeholder="Search by name or phone…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className={`shrink-0 flex items-center gap-1.5 px-4 rounded-xl text-xs font-semibold border ${
            showAdvanced || advancedActiveCount > 0 ? "bg-ink text-paper border-ink" : "bg-white/60 text-ink/60 border-ink/10"
          }`}
        >
          <SlidersHorizontal size={13} />
          Advanced
          {advancedActiveCount > 0 && <span className="opacity-70">({advancedActiveCount})</span>}
        </button>
      </div>

      {showAdvanced && (
        <AdvancedFilters
          areas={areaOptions}
          selectedAreas={selectedAreas}
          onToggleArea={toggleArea}
          budgetMin={budgetMin} budgetMax={budgetMax} setBudgetMin={setBudgetMin} setBudgetMax={setBudgetMax}
          sqftMin={sqftMin} sqftMax={sqftMax} setSqftMin={setSqftMin} setSqftMax={setSqftMax}
          facets={facets}
          selectedFacets={selectedFacets}
          onToggleFacetValue={toggleFacetValue}
          onClear={clearAdvanced}
        />
      )}

      {leads === null && <p className="text-ink/50 text-sm">Loading…</p>}
      {leads !== null && filtered.length === 0 && (
        <p className="text-ink/50 text-sm">No {label.toLowerCase()} leads match here yet.</p>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((lead) => (
          <LeadCard key={lead.id} lead={lead} accent={accent} onOpen={() => setOpenLeadId(lead.id)} />
        ))}
      </div>

      {openLead && (
        <LeadDetailModal
          lead={openLead}
          fields={fields}
          accent={accent}
          onClose={() => setOpenLeadId(null)}
          onSaveDetails={onChanged.updateMeta}
          onAddRemark={onChanged.addRemark}
        />
      )}

      {showNewVisit && (
        <NewFieldVisitModal
          accent={accent}
          onClose={() => setShowNewVisit(false)}
          onCreate={handleCreateFieldVisit}
        />
      )}
    </div>
  );
}
