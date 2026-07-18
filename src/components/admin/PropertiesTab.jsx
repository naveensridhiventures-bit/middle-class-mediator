import { useEffect, useState } from "react";
import ImageUploader from "../ImageUploader";
import {
  listPublicProperties,
  adminAddProperty,
  adminUpdateProperty,
  adminDeleteProperty,
} from "../../lib/api";

const EMPTY = {
  title: "",
  type: "House",
  price: "",
  location: "",
  description: "",
  contactPhone: "",
};

export default function PropertiesTab({ password }) {
  const [properties, setProperties] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [imageUrl, setImageUrl] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    listPublicProperties().then(setProperties).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      type: p.type,
      price: p.price,
      location: p.location,
      description: p.description,
      contactPhone: p.contactPhone || "",
    });
    setImageUrl(p.imageUrl || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(EMPTY);
    setImageUrl("");
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await adminUpdateProperty(password, editingId, { ...form, imageUrl });
      } else {
        await adminAddProperty(password, { ...form, imageUrl });
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remove this listing from the buyer page?")) return;
    await adminDeleteProperty(password, id);
    load();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="card-ledger p-5 sm:p-6 space-y-4">
        <p className="font-display font-semibold text-lg text-ink">
          {editingId ? "Edit listing" : "Add a listing for buyers"}
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Title</label>
            <input className="field-input" value={form.title} onChange={(e) => update("title", e.target.value)} required />
          </div>
          <div>
            <label className="field-label">Type</label>
            <select className="field-input" value={form.type} onChange={(e) => update("type", e.target.value)}>
              <option>House</option>
              <option>Shop</option>
              <option>Land / Plot</option>
              <option>Apartment</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="field-label">Location</label>
            <input className="field-input" value={form.location} onChange={(e) => update("location", e.target.value)} required />
          </div>
          <div>
            <label className="field-label">Price</label>
            <input className="field-input" value={form.price} onChange={(e) => update("price", e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Contact number for this listing (optional — defaults to admin)</label>
            <input className="field-input" value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} placeholder="e.g. 9198XXXXXXX" />
          </div>
        </div>
        <div>
          <label className="field-label">Description</label>
          <textarea className="field-input min-h-[90px]" value={form.description} onChange={(e) => update("description", e.target.value)} />
        </div>
        <div>
          <label className="field-label">Photo</label>
          <ImageUploader onUploaded={setImageUrl} />
        </div>
        {error && <p className="text-sm text-buyer">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? "Saving…" : editingId ? "Update listing" : "Publish listing"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn-ghost">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div>
        <p className="field-label mb-3">Live listings</p>
        {properties === null && <p className="text-ink/50 text-sm">Loading…</p>}
        {properties?.length === 0 && <p className="text-ink/50 text-sm">Nothing published yet.</p>}
        <div className="space-y-3">
          {properties?.map((p) => (
            <div key={p.id} className="card-ledger p-4 flex items-center gap-4">
              {p.imageUrl && <img src={p.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover border border-ink/10" />}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink text-sm truncate">{p.title}</p>
                <p className="text-xs text-ink/50">{p.location} · {p.price}</p>
              </div>
              <button onClick={() => startEdit(p)} className="btn-ghost !py-1.5 !px-3 text-xs">Edit</button>
              <button onClick={() => handleDelete(p.id)} className="text-xs text-buyer font-semibold px-2">Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
