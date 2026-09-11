import { useState } from "react";
import {
  User, MessageCircle, Home as HomeIcon, Building2, Building, LandPlot,
  Hotel, UtensilsCrossed, Scissors, Store, Briefcase, MapPin, Wallet,
  TrendingUp, Tag, Landmark, CheckCircle2, XCircle, Zap, CalendarClock,
  Search, ShieldCheck, AlertTriangle,
} from "lucide-react";
import Seal from "../components/Seal";
import RadioGroup from "../components/RadioGroup";
import BackHome from "../components/BackHome";
import Reveal from "../components/Reveal";
import { addBuyerLead } from "../lib/api";

const ACCENT = "#B5533C";

const PROPERTY_TYPES = ["Home / Independent House", "Apartment / Flat", "Villa", "Plot / Land", "Hotel", "Restaurant", "Saloon", "Shop / Retail", "Office / Commercial Space"];
const PURPOSE = ["Own Use", "Investment"];
const BUDGET = ["Below ₹30 Lakhs", "₹30–50 Lakhs", "₹50–75 Lakhs", "₹75 Lakhs–₹1 Crore", "Above ₹1 Crore"];
const LOCATIONS = ["North Chennai", "Central Chennai", "South Chennai", "No Specific Preference"];
const YES_NO = ["Yes", "No"];
const TIMELINE = ["Immediately", "Within 1 Month", "Within 3 Months", "Just Exploring"];

const TYPE_ICONS = {
  "Home / Independent House": HomeIcon,
  "Apartment / Flat": Building2,
  Villa: Building,
  "Plot / Land": LandPlot,
  Hotel: Hotel,
  Restaurant: UtensilsCrossed,
  Saloon: Scissors,
  "Shop / Retail": Store,
  "Office / Commercial Space": Briefcase,
};
const PURPOSE_ICONS = { "Own Use": HomeIcon, Investment: TrendingUp };
const BUDGET_ICONS = Object.fromEntries(BUDGET.map((b) => [b, Tag]));
const LOCATION_ICONS = Object.fromEntries(LOCATIONS.map((l) => [l, l === "No Specific Preference" ? Landmark : MapPin]));
const YES_NO_ICONS = { Yes: CheckCircle2, No: XCircle };
const TIMELINE_ICONS = { Immediately: Zap, "Within 1 Month": CalendarClock, "Within 3 Months": CalendarClock, "Just Exploring": Search };

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

  if (status === "done") {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-5 py-16">
        <div className="max-w-md w-full text-center">
          <Seal label="Registered" color={ACCENT} size={80} rotate={-4} />
          <h1 className="font-display font-semibold text-2xl text-ink mt-5 mb-2">
            Your report has been submitted
          </h1>
          <p className="text-ink/60 mb-7 leading-relaxed">
            Thanks <strong>{form.name}</strong> — your requirements are on record. Our team
            reviews every submission and will reach out to you directly with matching properties.
          </p>
          <a href="/buyer" className="btn-ghost w-full">
            Register another requirement
          </a>
          <a href="/" className="block mt-3 text-sm text-ink/40 hover:text-ink">
            Back to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-lg mx-auto px-5 py-10">
        <BackHome color={ACCENT} />
        <div className="text-center mb-7">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center" style={{ borderColor: ACCENT }}>
              <span className="font-display font-bold text-sm tracking-wide" style={{ color: ACCENT }}>MCM</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 mb-1.5">
            <span className="h-px w-8" style={{ backgroundColor: `${ACCENT}40` }} />
            <p className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: ACCENT }}>Looking to buy in Chennai?</p>
            <span className="h-px w-8" style={{ backgroundColor: `${ACCENT}40` }} />
          </div>
          <h1 className="font-display font-bold text-3xl text-ink">Buyer registration</h1>
          <p className="text-ink/50 text-sm mt-1.5">
            Tell us what you're looking for — all fields marked <span className="text-buyer font-semibold">*</span> are required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card-ledger p-6 space-y-6 shadow-xl">
          <Reveal className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Full name <span className="text-buyer">*</span></label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
                <input className="field-input !pl-10" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Full name" required />
              </div>
            </div>
            <div>
              <label className="field-label">Mobile number (WhatsApp) <span className="text-buyer">*</span></label>
              <div className="relative">
                <MessageCircle size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
                <input className="field-input !pl-10" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, ""))} placeholder="10-digit number" required />
              </div>
            </div>
          </Reveal>

          <div className="border-t border-ink/5 pt-6 space-y-6">
            <Reveal className="space-y-6">
              <RadioGroup stepNumber="1" label="Property type" required options={PROPERTY_TYPES} value={form.propertyType} onChange={(v) => update("propertyType", v)} accentColor={ACCENT} icons={TYPE_ICONS} />
              <RadioGroup stepNumber="2" label="Purpose" required options={PURPOSE} value={form.purpose} onChange={(v) => update("purpose", v)} accentColor={ACCENT} icons={PURPOSE_ICONS} />
              <RadioGroup stepNumber="3" label="Budget" required options={BUDGET} value={form.budget} onChange={(v) => update("budget", v)} accentColor={ACCENT} icons={BUDGET_ICONS} />
            </Reveal>
            <Reveal className="space-y-6">
              <RadioGroup stepNumber="4" label="Preferred location" required options={LOCATIONS} value={form.preferredLocation} onChange={(v) => update("preferredLocation", v)} accentColor={ACCENT} icons={LOCATION_ICONS} />
              <RadioGroup stepNumber="5" label="Loan requirement" required options={YES_NO} value={form.loanRequirement} onChange={(v) => update("loanRequirement", v)} accentColor={ACCENT} icons={YES_NO_ICONS} />
              <RadioGroup stepNumber="6" label="When are you planning to buy?" required options={TIMELINE} value={form.timeline} onChange={(v) => update("timeline", v)} accentColor={ACCENT} icons={TIMELINE_ICONS} />
            </Reveal>
          </div>

          {errorMsg && (
            <p className="alert-error">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              {errorMsg}
            </p>
          )}

          <button type="submit" disabled={status === "saving" || !isComplete} className="btn-primary w-full flex items-center justify-center gap-2">
            {status === "saving" ? "Saving…" : (
              <>
                Submit report
                <Wallet size={16} />
              </>
            )}
          </button>
          {!isComplete && status === "idle" && (
            <p className="text-xs text-ink/35 text-center -mt-3">Fill in the required fields marked with * to continue.</p>
          )}
          <p className="text-xs text-ink/40 leading-relaxed flex items-start gap-1.5">
            <ShieldCheck size={13} className="shrink-0 mt-0.5" />
            This submits your requirements as a report for our team. After reviewing, our team
            will contact you with matching properties based on your requirements.
          </p>
        </form>
      </div>
    </div>
  );
}
