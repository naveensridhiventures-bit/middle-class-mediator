import { useState } from "react";
import Seal from "../components/Seal";
import RadioGroup from "../components/RadioGroup";
import { addBuyerLead } from "../lib/api";
import { whatsappLink } from "../lib/whatsapp";
import { ADMIN_WHATSAPP_NUMBER } from "../lib/config";

const ACCENT = "#B5533C";

const PROPERTY_TYPES = ["Apartment / Flat", "Independent House", "Villa", "Plot / Land", "Commercial Property"];
const PURPOSE = ["Own Use", "Investment"];
const BUDGET = ["Below ₹30 Lakhs", "₹30–50 Lakhs", "₹50–75 Lakhs", "₹75 Lakhs–₹1 Crore", "Above ₹1 Crore"];
const LOCATIONS = ["North Chennai", "Central Chennai", "South Chennai", "No Specific Preference"];
const YES_NO = ["Yes", "No"];
const TIMELINE = ["Immediately", "Within 1 Month", "Within 3 Months", "Just Exploring"];

export default function Buyer() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    propertyType: "",
    purpose: "",
    budget: "",
    preferredLocation: "",
    loanRequirement: "",
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
    form.purpose &&
    form.budget &&
    form.preferredLocation &&
    form.loanRequirement &&
    form.timeline;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isComplete) return;
    setStatus("saving");
    setErrorMsg("");
    try {
      await addBuyerLead(form);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err.message || "Could not save — check your connection and try again.");
      setStatus("error");
    }
  }

  const waMessage =
    `New buyer registration — ${form.propertyType}\n` +
    `From: ${form.name} (${form.phone})\n` +
    `Purpose: ${form.purpose}\n` +
    `Budget: ${form.budget}\n` +
    `Preferred location: ${form.preferredLocation}\n` +
    `Loan requirement: ${form.loanRequirement}\n` +
    `Planning to buy: ${form.timeline}`;

  if (status === "done") {
    return (
      <div className="max-w-md mx-auto px-5 pt-16 pb-28 lg:pb-0 text-center">
        <Seal label="Registered" color={ACCENT} size={80} rotate={-4} />
        <h1 className="font-display font-semibold text-2xl text-ink mt-5 mb-2">
          We've got your requirements
        </h1>
        <p className="text-ink/60 mb-7 leading-relaxed">
          Thanks <strong>{form.name}</strong> — we'll contact you with matching properties based
          on what you're looking for. Send it across on WhatsApp so we can start right away.
        </p>
        <a
          href={whatsappLink(ADMIN_WHATSAPP_NUMBER, waMessage)}
          target="_blank"
          rel="noreferrer"
          className="btn-whatsapp w-full"
        >
          Message admin on WhatsApp
        </a>
        <a href="/buyer" className="block mt-4 text-sm text-ink/50 hover:text-ink">
          Register another requirement
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 pb-28 lg:pb-20">
      <div className="pt-10 pb-6 flex items-center gap-4">
        <Seal label="Buyer" color={ACCENT} size={64} rotate={-4} />
        <div>
          <p className="field-label mb-0.5">Looking to buy in Chennai?</p>
          <h1 className="font-display font-semibold text-2xl text-ink">Buyer registration</h1>
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
        <RadioGroup label="2. Purpose" options={PURPOSE} value={form.purpose} onChange={(v) => update("purpose", v)} accentColor={ACCENT} />
        <RadioGroup label="3. Budget" options={BUDGET} value={form.budget} onChange={(v) => update("budget", v)} accentColor={ACCENT} />
        <RadioGroup label="4. Preferred location" options={LOCATIONS} value={form.preferredLocation} onChange={(v) => update("preferredLocation", v)} accentColor={ACCENT} />
        <RadioGroup label="5. Loan requirement" options={YES_NO} value={form.loanRequirement} onChange={(v) => update("loanRequirement", v)} accentColor={ACCENT} />
        <RadioGroup label="6. When are you planning to buy?" options={TIMELINE} value={form.timeline} onChange={(v) => update("timeline", v)} accentColor={ACCENT} />

        {errorMsg && <p className="text-sm text-buyer">{errorMsg}</p>}

        <button type="submit" disabled={status === "saving" || !isComplete} className="btn-primary w-full">
          {status === "saving" ? "Saving…" : "Save & continue to WhatsApp"}
        </button>
        <p className="text-xs text-ink/40 leading-relaxed">
          After reviewing, our team will contact you with matching properties based on your
          requirements.
        </p>
      </form>
    </div>
  );
}
