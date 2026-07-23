import { useState } from "react";
import Seal from "../components/Seal";
import RadioGroup from "../components/RadioGroup";
import { addMediatorLead } from "../lib/api";
import { whatsappLink } from "../lib/whatsapp";
import { ADMIN_WHATSAPP_NUMBER } from "../lib/config";

const ACCENT = "#2D4373";

const PROFESSIONS = ["Mediator", "Real Estate Agent", "Builder", "Developer"];
const AREAS = ["North Chennai", "Central Chennai", "South Chennai", "All Over Chennai"];
const CATEGORIES = ["Residential", "Commercial", "Land", "Rental", "All Categories"];
const EXPERIENCE = ["Below 1 Year", "1–3 Years", "3–5 Years", "Above 5 Years"];
const DEAL_TYPES = ["Sale", "Rental", "Lease", "All"];
const YES_NO = ["Yes", "No"];

export default function Mediator() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    profession: "",
    workingArea: "",
    propertyCategory: "",
    experience: "",
    dealType: "",
    genuineLeads: "",
  });
  const [status, setStatus] = useState("idle"); // idle | saving | done | error
  const [errorMsg, setErrorMsg] = useState("");

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isComplete =
    form.name &&
    form.phone &&
    form.profession &&
    form.workingArea &&
    form.propertyCategory &&
    form.experience &&
    form.dealType &&
    form.genuineLeads;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isComplete) return;
    setStatus("saving");
    setErrorMsg("");
    try {
      await addMediatorLead(form);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err.message || "Could not save — check your connection and try again.");
      setStatus("error");
    }
  }

  const waMessage =
    `Chennai Mediator Network — New registration\n` +
    `Name: ${form.name} (${form.phone})\n` +
    `Profession: ${form.profession}\n` +
    `Working Area: ${form.workingArea}\n` +
    `Property Category: ${form.propertyCategory}\n` +
    `Experience: ${form.experience}\n` +
    `Deal Type: ${form.dealType}\n` +
    `Shares only genuine leads: ${form.genuineLeads}`;

  if (status === "done") {
    return (
      <div className="max-w-md mx-auto px-5 pt-16 text-center">
        <Seal label="Received" color={ACCENT} size={80} rotate={-10} />
        <h1 className="font-display font-semibold text-2xl text-ink mt-5 mb-2">
          You're on our network
        </h1>
        <p className="text-ink/60 mb-7 leading-relaxed">
          Thanks <strong>{form.name}</strong> — your registration is logged. Send it to us on
          WhatsApp now so our team can review and get in touch.
        </p>
        <a
          href={whatsappLink(ADMIN_WHATSAPP_NUMBER, waMessage)}
          target="_blank"
          rel="noreferrer"
          className="btn-whatsapp w-full"
        >
          Message admin on WhatsApp
        </a>
        <a href="/mediator" className="block mt-4 text-sm text-ink/50 hover:text-ink">
          Register another
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 pb-20">
      <div className="pt-10 pb-6 flex items-center gap-4">
        <Seal label="Mediator" color={ACCENT} size={64} rotate={-8} />
        <div>
          <p className="field-label mb-0.5">Chennai Mediator Network</p>
          <h1 className="font-display font-semibold text-2xl text-ink">Registration form</h1>
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

        <RadioGroup label="1. Your profession" options={PROFESSIONS} value={form.profession} onChange={(v) => update("profession", v)} accentColor={ACCENT} />
        <RadioGroup label="2. Working area" options={AREAS} value={form.workingArea} onChange={(v) => update("workingArea", v)} accentColor={ACCENT} />
        <RadioGroup label="3. Property category" options={CATEGORIES} value={form.propertyCategory} onChange={(v) => update("propertyCategory", v)} accentColor={ACCENT} />
        <RadioGroup label="4. Experience" options={EXPERIENCE} value={form.experience} onChange={(v) => update("experience", v)} accentColor={ACCENT} />
        <RadioGroup label="5. Deal type" options={DEAL_TYPES} value={form.dealType} onChange={(v) => update("dealType", v)} accentColor={ACCENT} />
        <RadioGroup label="6. Do you share only genuine property leads?" options={YES_NO} value={form.genuineLeads} onChange={(v) => update("genuineLeads", v)} accentColor={ACCENT} />

        {errorMsg && <p className="text-sm text-buyer">{errorMsg}</p>}

        <button type="submit" disabled={status === "saving" || !isComplete} className="btn-primary w-full">
          {status === "saving" ? "Saving…" : "Save & continue to WhatsApp"}
        </button>
        <p className="text-xs text-ink/40 leading-relaxed">
          After submitting this form, our team will review your details and get in touch.
        </p>
      </form>
    </div>
  );
}
