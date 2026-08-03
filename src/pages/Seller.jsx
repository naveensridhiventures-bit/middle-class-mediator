import { useState } from "react";
import {
  User, MessageCircle, Home as HomeIcon, Building2, Building, LandPlot,
  Hotel, UtensilsCrossed, Scissors, Store, Briefcase, MapPin, Sparkles,
  RefreshCw, HardHat, Tag, ShieldCheck, Zap, CalendarClock, Search,
} from "lucide-react";
import Seal from "../components/Seal";
import RadioGroup from "../components/RadioGroup";
import { addSellerLead } from "../lib/api";
import { whatsappLink } from "../lib/whatsapp";
import { MEDIATOR_WHATSAPP_NUMBER } from "../lib/config";

const ACCENT = "#1F6F5C";

const PROPERTY_TYPES = ["Home / Independent House", "Apartment / Flat", "Villa", "Plot / Land", "Hotel", "Restaurant", "Saloon", "Shop / Retail", "Office / Commercial Space"];
const LOCATIONS = ["North Chennai", "Central Chennai", "South Chennai", "Other"];
const PROPERTY_STATUS = ["Brand New", "Resale", "Under Construction"];
const PRICE_RANGES = ["Below ₹30 Lakhs", "₹30–50 Lakhs", "₹50–75 Lakhs", "₹75 Lakhs–₹1 Crore", "Above ₹1 Crore"];
const OWNERSHIP = ["Direct Owner", "Authorized Representative", "Builder / Developer"];
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
const LOCATION_ICONS = Object.fromEntries(LOCATIONS.map((l) => [l, MapPin]));
const STATUS_ICONS = { "Brand New": Sparkles, Resale: RefreshCw, "Under Construction": HardHat };
const PRICE_ICONS = Object.fromEntries(PRICE_RANGES.map((p) => [p, Tag]));
const OWNERSHIP_ICONS = { "Direct Owner": User, "Authorized Representative": ShieldCheck, "Builder / Developer": Building2 };
const TIMELINE_ICONS = { Immediately: Zap, "Within 1 Month": CalendarClock, "Within 3 Months": CalendarClock, "Just Exploring": Search };

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
      <div className="min-h-screen bg-paper flex items-center justify-center px-5 py-16">
        <div className="max-w-md w-full text-center">
          <Seal label="Listed" color={ACCENT} size={80} rotate={6} />
          <h1 className="font-display font-semibold text-2xl text-ink mt-5 mb-2">
            Your property is on record
          </h1>
          <p className="text-ink/60 mb-7 leading-relaxed">
            We've saved your listing in {form.propertyLocation}. As the seller, you can message
            the mediator directly on WhatsApp — they'll follow up with you personally.
          </p>
          <a
            href={whatsappLink(MEDIATOR_WHATSAPP_NUMBER, waMessage)}
            target="_blank"
            rel="noreferrer"
            className="btn-whatsapp w-full"
          >
            Message the mediator on WhatsApp
          </a>
          <a href="/seller" className="block mt-4 text-sm text-ink/50 hover:text-ink">
            List another property
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-lg mx-auto px-5 py-10">
        <div className="text-center mb-7">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center" style={{ borderColor: ACCENT }}>
              <span className="font-display font-bold text-sm tracking-wide" style={{ color: ACCENT }}>MCM</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 mb-1.5">
            <span className="h-px w-8" style={{ backgroundColor: `${ACCENT}40` }} />
            <p className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: ACCENT }}>List your property</p>
            <span className="h-px w-8" style={{ backgroundColor: `${ACCENT}40` }} />
          </div>
          <h1 className="font-display font-bold text-3xl text-ink">Seller registration</h1>
          <p className="text-ink/50 text-sm mt-1.5">Help us understand your property better</p>
        </div>

        <form onSubmit={handleSubmit} className="card-ledger p-6 space-y-6 shadow-xl">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
                <input className="field-input !pl-10" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Full name" required />
              </div>
            </div>
            <div>
              <label className="field-label">Mobile number (WhatsApp)</label>
              <div className="relative">
                <MessageCircle size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
                <input className="field-input !pl-10" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="10-digit number" required />
              </div>
            </div>
          </div>

          <div className="border-t border-ink/5 pt-6 space-y-6">
            <RadioGroup stepNumber="1" label="Property type" options={PROPERTY_TYPES} value={form.propertyType} onChange={(v) => update("propertyType", v)} accentColor={ACCENT} icons={TYPE_ICONS} />
            <RadioGroup stepNumber="2" label="Property location" options={LOCATIONS} value={form.propertyLocation} onChange={(v) => update("propertyLocation", v)} accentColor={ACCENT} icons={LOCATION_ICONS} />
            <RadioGroup stepNumber="3" label="Property status" options={PROPERTY_STATUS} value={form.propertyStatus} onChange={(v) => update("propertyStatus", v)} accentColor={ACCENT} icons={STATUS_ICONS} />
            <RadioGroup stepNumber="4" label="Expected selling price" options={PRICE_RANGES} value={form.expectedPrice} onChange={(v) => update("expectedPrice", v)} accentColor={ACCENT} icons={PRICE_ICONS} />
            <RadioGroup stepNumber="5" label="Ownership" options={OWNERSHIP} value={form.ownership} onChange={(v) => update("ownership", v)} accentColor={ACCENT} icons={OWNERSHIP_ICONS} />
            <RadioGroup stepNumber="6" label="When are you planning to sell?" options={TIMELINE} value={form.timeline} onChange={(v) => update("timeline", v)} accentColor={ACCENT} icons={TIMELINE_ICONS} />
          </div>

          {errorMsg && <p className="text-sm text-buyer">{errorMsg}</p>}

          <button type="submit" disabled={status === "saving" || !isComplete} className="btn-primary w-full flex items-center justify-center gap-2">
            {status === "saving" ? "Saving…" : (
              <>
                Save &amp; continue to WhatsApp
                <MessageCircle size={16} />
              </>
            )}
          </button>
          <p className="text-xs text-ink/40 leading-relaxed flex items-start gap-1.5">
            <ShieldCheck size={13} className="shrink-0 mt-0.5" />
            After reviewing your property details, our team will contact you directly for the next steps.
          </p>
        </form>
      </div>
    </div>
  );
}
