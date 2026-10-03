import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import ImageUploader from "../ImageUploader";
import { TextInput, SelectInput, Field } from "./ui";
import { adminInputCls, btnDark, btnOutline } from "./styles";
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

const TYPES = ["House", "Shop", "Land / Plot", "Apartment", "Other"];

export default function PropertiesTab({ password }) {
  const [properties, setProperties] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [imageUrl, setImageUrl] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState(null);

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

  // Two taps instead of a browser pop-up: first tap arms it, second removes.
  async function handleDelete(id) {
    if (confirmId !== id) {
      setConfirmId(id);
      setTimeout(() => setConfirmId((c) => (c === id ? null : c)), 4000);
      return;
    }
    setConfirmId(null);
    try {
      await adminDeleteProperty(password, id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="grid lg:grid-cols-[minmax(0,26rem)_1fr] gap-6 items-start">
      <form onSubmit={handleSubmit} className="rounded-2xl bg-surface border border-ink/10 p-5 lg:sticky lg:top-4">
        <h2 className="font-display font-bold text-[1.2rem] text-ink">{editingId ? "Edit listing" : "Add a listing"}</h2>
        <p className="text-xs text-ink/55 mt-1">Shown on the public gallery for buyers.</p>

        <div className="mt-5 grid gap-3.5">
          <TextInput label="Title" required value={form.title} onChange={(e) => update("title", e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <SelectInput label="Type" options={TYPES} value={form.type} onChange={(e) => update("type", e.target.value)} />
            <TextInput label="Price" required placeholder="e.g. ₹50,00,000" value={form.price} onChange={(e) => update("price", e.target.value)} />
          </div>
          <TextInput label="Location" required value={form.location} onChange={(e) => update("location", e.target.value)} />
          <TextInput
            label="Contact number (optional)"
            hint="Leave blank to use the admin number."
            type="tel"
            inputMode="tel"
            placeholder="e.g. 9198XXXXXXX"
            value={form.contactPhone}
            onChange={(e) => update("contactPhone", e.target.value)}
          />
          <Field label="Description">
            {(id) => (
              <textarea id={id} className={`${adminInputCls} min-h-[96px]`} value={form.description} onChange={(e) => update("description", e.target.value)} />
            )}
          </Field>
          <Field label="Photo">
            <ImageUploader onUploaded={setImageUrl} />
          </Field>
        </div>

        {error && <p className="alert-error mt-4">{error}</p>}

        <div className="mt-5 flex gap-2.5">
          <button type="submit" disabled={saving} className={`${btnDark} flex-1 !h-12`}>
            {saving ? "Saving…" : editingId ? "Update listing" : "Publish listing"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className={`${btnOutline} !h-12`}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div>
        <h2 className="font-display font-bold text-[1.2rem] text-ink mb-3">
          Live listings {properties?.length ? <span className="text-ink/45 text-base">({properties.length})</span> : null}
        </h2>
        {properties === null && !error && (
          <div className="space-y-3">
            {[0, 1].map((i) => <div key={i} className="h-20 rounded-2xl skeleton" />)}
          </div>
        )}
        {properties?.length === 0 && (
          <div className="rounded-2xl bg-surface border border-dashed border-ink/20 p-8 text-center">
            <p className="font-display font-bold text-lg text-ink">Nothing published yet</p>
            <p className="text-sm text-ink/55 mt-1">Add a listing here, or share a seller lead to the gallery from the Sellers tab.</p>
          </div>
        )}
        <div className="space-y-3">
          {properties?.map((p) => (
            <div key={p.id} className="rounded-2xl bg-surface border border-ink/10 p-3.5 flex items-center gap-3.5">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-ink/10 shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-ink/5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-[15px] text-ink truncate">{p.title}</p>
                <p className="text-xs text-ink/55 truncate">{[p.location, p.price].filter(Boolean).join(" · ")}</p>
              </div>
              <button onClick={() => startEdit(p)} aria-label={`Edit ${p.title}`} className="w-11 h-11 rounded-full border border-ink/15 hover:bg-ink/5 flex items-center justify-center shrink-0">
                <Pencil size={15} />
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                aria-label={`Remove ${p.title}`}
                className={`h-11 rounded-full flex items-center justify-center gap-1.5 shrink-0 text-[12px] font-bold transition-colors ${
                  confirmId === p.id ? "bg-coral text-white px-4" : "w-11 border border-coral/40 text-coral hover:bg-coral/10"
                }`}
              >
                <Trash2 size={15} />
                {confirmId === p.id && "Confirm"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
