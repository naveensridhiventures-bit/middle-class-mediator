import { useState } from "react";
import Seal from "../components/Seal";
import RadioGroup from "../components/RadioGroup";
import { addSellerLead } from "../lib/api";
import { whatsappLink } from "../lib/whatsapp";
import { ADMIN_WHATSAPP_NUMBER } from "../lib/config";

const ACCENT = "#1F6F5C";

const PROPERTY_TYPES = ["Apartment / Flat", "Independent House", "Villa", "Plot / Land", "Commercial Property"];
const LOCATIONS = ["North Chennai", "Central Chennai", "South Chennai", "Other"];
const PROPERTY_STATUS = ["Brand New", "Resale", "Under Construction"];
const PRICE_RANGES = ["Below ₹30 Lakhs", "₹30–50 Lakhs", "₹50–75 Lakhs", "₹75 Lakhs–₹1 Crore", "Above ₹1 Crore"];
const OWNERSHIP = ["Direct Owner", "Authorized Representative", "Builder / Developer"];
const TIMELINE = ["Immediately", "Within 1 Month", "Within 3 Months", "Just Exploring"];

export default function Seller() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    propertyType: "",
    propertyLocation: "",
    propertyStatus: "",
    expectedPrice: "",
    ownership: "",
    timeline: "",
  });
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isComplete =
    form.name &&
    form.phone &&
    form.propertyType &&
    form.propertyLocation &&
    form.propertyStatus &&
    form.expectedPrice &&
    form.ownership &&
    form.timeline;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isComplete) return;
    setStatus("saving");
    setErrorMsg("");
    try {
      await addSellerLead(form);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err.message || "Could not save — check your connection and try again.");
      setStatus("error");
    }
  }

  const waMessage =
    `New seller registration — ${form.propertyType}\n` +
    `From: ${form.name} (${form.phone})\n` +
    `Location: ${form.propertyLocation}\n` +
    `Status: ${form.propertyStatus}\n` +
    `Expected price: ${form.expectedPrice}\n` +
    `Ownership: ${form.ownership}\n` +
    `Planning to sell: ${form.timeline}`;

  if (status === "done") {
    return (
      <div className="max-w-md mx-auto px-5 pt-16 text-center">
        <Seal label="Listed" color={ACCENT} size={80} rotate={6} />
        <h1 className="font-display font-semibold text-2xl text-ink mt-5 mb-2">
          Your property is on record
        </h1>
        <p className="text-ink/60 mb-7 leading-relaxed">
          We've saved your listing in {form.propertyLocation}. Send it across on WhatsApp and
          we'll follow up with you directly.
        </p>
        <a
          href={whatsappLink(ADMIN_WHATSAPP_NUMBER, waMessage)}
          target="_blank"
          rel="noreferrer"
          className="btn-whatsapp w-full"
        >
          Message admin on WhatsApp
        </a>
        <a href="/seller" className="block mt-4 text-sm text-ink/50 hover:text-ink">
          List another property
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 pb-20">
      <div className="pt-10 pb-6 flex items-center gap-4">
        <Seal label="Seller" color={ACCENT} size={64} rotate={5} />
        <div>
          <p className="field-label mb-0.5">List your property</p>
          <h1 className="font-display font-semibold text-2xl text-ink">Seller registration</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card-ledger p-6 space-y-6">
        <div>
          <label className="field-label">Full name</label>
          <input className="field-input" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Full name" required />
        </div>
        <div>
          <label className="field-label">Mobile number (WhatsApp)</label>
          <input className="field-input" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="10-digit number" required />
        </div>

        <RadioGroup label="1. Property type" options={PROPERTY_TYPES} value={form.propertyType} onChange={(v) => update("propertyType", v)} accentColor={ACCENT} />
        <RadioGroup label="2. Property location" options={LOCATIONS} value={form.propertyLocation} onChange={(v) => update("propertyLocation", v)} accentColor={ACCENT} />
        <RadioGroup label="3. Property status" options={PROPERTY_STATUS} value={form.propertyStatus} onChange={(v) => update("propertyStatus", v)} accentColor={ACCENT} />
        <RadioGroup label="4. Expected selling price" options={PRICE_RANGES} value={form.expectedPrice} onChange={(v) => update("expectedPrice", v)} accentColor={ACCENT} />
        <RadioGroup label="5. Ownership" options={OWNERSHIP} value={form.ownership} onChange={(v) => update("ownership", v)} accentColor={ACCENT} />
        <RadioGroup label="6. When are you planning to sell?" options={TIMELINE} value={form.timeline} onChange={(v) => update("timeline", v)} accentColor={ACCENT} />

        {errorMsg && <p className="text-sm text-buyer">{errorMsg}</p>}

        <button type="submit" disabled={status === "saving" || !isComplete} className="btn-primary w-full">
          {status === "saving" ? "Saving…" : "Save & continue to WhatsApp"}
        </button>
        <p className="text-xs text-ink/40 leading-relaxed">
          After reviewing your property details, our team will contact you directly for the next steps.
        </p>
      </form>
    </div>
  );
}
