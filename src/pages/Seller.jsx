import { useState } from "react";
import {
  User, MessageCircle, Home as HomeIcon, Building2, Building, LandPlot,
  Hotel, UtensilsCrossed, Scissors, Store, Briefcase, MapPin, Sparkles,
  RefreshCw, HardHat, Tag, ShieldCheck, Zap, CalendarClock, Search,
  Image as ImageIcon, Clock, TrendingUp, CalendarRange, Layers, Ruler,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, FileText, AlertTriangle,
  CheckCircle2, Car, Bike, XCircle, Key, DoorOpen, CreditCard, Ban,
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
const OWNER_TYPE = ["Direct Owner", "Agent / Broker"];
const TIMELINE = ["Immediately", "Within 1 Month", "Within 3 Months", "Just Exploring"];
const PHOTOS_SHARED = ["Shared", "Will Share Later"];
const PURPOSE = ["Own Use", "Investment"];
const PROPERTY_AGE = ["Less than 1 Year", "1–5 Years", "5–10 Years", "Above 10 Years"];
const BUILDING_TYPE = ["Ground Floor", "G+1", "G+2", "G+3 & Above", "Apartment"];
const ROAD_WIDTH = ["20 Feet", "24 Feet", "30 Feet", "40 Feet & Above"];
const FACING = ["North", "South", "East", "West"];
const PROPERTY_USAGE = ["Residential", "Commercial", "Semi-Commercial"];
const PATTA_APPROVAL = ["Online Patta", "CMDA", "DTCP", "Panchayat", "Not Approved"];
const APPROVAL_STATUS = ["Land Approved", "Building Approved", "Both Approved"];
const PARKING = ["Car Parking", "Bike Parking", "Both", "No Parking"];
const RENTAL_STATUS = ["Rented", "Vacant"];
const LOAN_STATUS = ["Loan Running", "Loan Closed", "No Loan"];

const TYPE_ICONS = {
  "Home / Independent House": HomeIcon, "Apartment / Flat": Building2, Villa: Building,
  "Plot / Land": LandPlot, Hotel: Hotel, Restaurant: UtensilsCrossed, Saloon: Scissors,
  "Shop / Retail": Store, "Office / Commercial Space": Briefcase,
};
const LOCATION_ICONS = Object.fromEntries(LOCATIONS.map((l) => [l, MapPin]));
const STATUS_ICONS = { "Brand New": Sparkles, Resale: RefreshCw, "Under Construction": HardHat };
const PRICE_ICONS = Object.fromEntries(PRICE_RANGES.map((p) => [p, Tag]));
const OWNER_TYPE_ICONS = { "Direct Owner": User, "Agent / Broker": Briefcase };
const TIMELINE_ICONS = { Immediately: Zap, "Within 1 Month": CalendarClock, "Within 3 Months": CalendarClock, "Just Exploring": Search };
const PHOTOS_SHARED_ICONS = { Shared: ImageIcon, "Will Share Later": Clock };
const PURPOSE_ICONS = { "Own Use": HomeIcon, Investment: TrendingUp };
const AGE_ICONS = Object.fromEntries(PROPERTY_AGE.map((a) => [a, CalendarRange]));
const BUILDING_TYPE_ICONS = Object.fromEntries(BUILDING_TYPE.map((b) => [b, Layers]));
const ROAD_WIDTH_ICONS = Object.fromEntries(ROAD_WIDTH.map((r) => [r, Ruler]));
const FACING_ICONS = { North: ArrowUp, South: ArrowDown, East: ArrowRight, West: ArrowLeft };
const USAGE_ICONS = { Residential: HomeIcon, Commercial: Building2, "Semi-Commercial": Building };
const PATTA_ICONS = { "Online Patta": FileText, CMDA: FileText, DTCP: FileText, Panchayat: FileText, "Not Approved": AlertTriangle };
const APPROVAL_STATUS_ICONS = Object.fromEntries(APPROVAL_STATUS.map((a) => [a, CheckCircle2]));
const PARKING_ICONS = { "Car Parking": Car, "Bike Parking": Bike, Both: CheckCircle2, "No Parking": XCircle };
const RENTAL_ICONS = { Rented: Key, Vacant: DoorOpen };
const LOAN_ICONS = { "Loan Running": CreditCard, "Loan Closed": CheckCircle2, "No Loan": Ban };

const emptyForm = {
  name: "", phone: "",
  ownership: "", propertyLocation: "", photosShared: "",
  propertyType: "", purpose: "", propertyStatus: "", propertyAge: "", buildingType: "",
  landArea: "", builtUpArea: "", frontageLength: "", frontageBreadth: "",
  roadWidth: "", facing: "", propertyUsage: "", pattaApproval: "", approvalStatus: "",
  parking: "", rentalStatus: "", loanStatus: "",
  expectedPrice: "", timeline: "", sellerRemarks: "",
};

export default function Seller() {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isComplete =
    form.name && form.phone && form.ownership && form.propertyLocation &&
    form.propertyType && form.propertyStatus && form.expectedPrice && form.timeline;

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
          <a href={whatsappLink(MEDIATOR_WHATSAPP_NUMBER, waMessage)} target="_blank" rel="noreferrer" className="btn-whatsapp w-full">
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
            <p className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: ACCENT }}>Property owner details</p>
            <span className="h-px w-8" style={{ backgroundColor: `${ACCENT}40` }} />
          </div>
          <h1 className="font-display font-bold text-3xl text-ink">Seller registration</h1>
          <p className="text-ink/50 text-sm mt-1.5">
            Give us as much detail as you can — the starred fields are required, everything else helps us match you faster.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card-ledger p-6 space-y-6 shadow-xl">
          <RadioGroup stepNumber="1" label="Are you the property owner?" options={OWNER_TYPE} value={form.ownership} onChange={(v) => update("ownership", v)} accentColor={ACCENT} icons={OWNER_TYPE_ICONS} />

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

          <div>
            <label className="field-label">Property location</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
              <input className="field-input !pl-10" value={form.propertyLocation} onChange={(e) => update("propertyLocation", e.target.value)} placeholder="Area / locality" required />
            </div>
          </div>

          <div className="border-t border-ink/5 pt-6 space-y-6">
            <RadioGroup stepNumber="2" label="Photos &amp; videos" options={PHOTOS_SHARED} value={form.photosShared} onChange={(v) => update("photosShared", v)} accentColor={ACCENT} icons={PHOTOS_SHARED_ICONS} />
            <RadioGroup stepNumber="3" label="Property type" options={PROPERTY_TYPES} value={form.propertyType} onChange={(v) => update("propertyType", v)} accentColor={ACCENT} icons={TYPE_ICONS} />
            <RadioGroup stepNumber="4" label="Purpose" options={PURPOSE} value={form.purpose} onChange={(v) => update("purpose", v)} accentColor={ACCENT} icons={PURPOSE_ICONS} />
            <RadioGroup stepNumber="5" label="Property status" options={PROPERTY_STATUS} value={form.propertyStatus} onChange={(v) => update("propertyStatus", v)} accentColor={ACCENT} icons={STATUS_ICONS} />
            <RadioGroup stepNumber="6" label="Property age" options={PROPERTY_AGE} value={form.propertyAge} onChange={(v) => update("propertyAge", v)} accentColor={ACCENT} icons={AGE_ICONS} />
            <RadioGroup stepNumber="7" label="Building type" options={BUILDING_TYPE} value={form.buildingType} onChange={(v) => update("buildingType", v)} accentColor={ACCENT} icons={BUILDING_TYPE_ICONS} />

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="field-label">8. Land area (sq.ft)</label>
                <input type="number" className="field-input" value={form.landArea} onChange={(e) => update("landArea", e.target.value)} placeholder="e.g. 1200" />
              </div>
              <div>
                <label className="field-label">9. Built-up area (sq.ft)</label>
                <input type="number" className="field-input" value={form.builtUpArea} onChange={(e) => update("builtUpArea", e.target.value)} placeholder="e.g. 1800" />
              </div>
            </div>

            <div>
              <label className="field-label">10. Frontage / size</label>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" className="field-input" value={form.frontageLength} onChange={(e) => update("frontageLength", e.target.value)} placeholder="Length (ft)" />
                <input type="number" className="field-input" value={form.frontageBreadth} onChange={(e) => update("frontageBreadth", e.target.value)} placeholder="Breadth (ft)" />
              </div>
            </div>

            <RadioGroup stepNumber="11" label="Road width" options={ROAD_WIDTH} value={form.roadWidth} onChange={(v) => update("roadWidth", v)} accentColor={ACCENT} icons={ROAD_WIDTH_ICONS} />
            <RadioGroup stepNumber="12" label="Facing" options={FACING} value={form.facing} onChange={(v) => update("facing", v)} accentColor={ACCENT} icons={FACING_ICONS} />
            <RadioGroup stepNumber="13" label="Property usage" options={PROPERTY_USAGE} value={form.propertyUsage} onChange={(v) => update("propertyUsage", v)} accentColor={ACCENT} icons={USAGE_ICONS} />
            <RadioGroup stepNumber="14" label="Patta / approval" options={PATTA_APPROVAL} value={form.pattaApproval} onChange={(v) => update("pattaApproval", v)} accentColor={ACCENT} icons={PATTA_ICONS} />
            <RadioGroup stepNumber="15" label="Approval status" options={APPROVAL_STATUS} value={form.approvalStatus} onChange={(v) => update("approvalStatus", v)} accentColor={ACCENT} icons={APPROVAL_STATUS_ICONS} />
            <RadioGroup stepNumber="16" label="Parking" options={PARKING} value={form.parking} onChange={(v) => update("parking", v)} accentColor={ACCENT} icons={PARKING_ICONS} />
            <RadioGroup stepNumber="17" label="Rental status" options={RENTAL_STATUS} value={form.rentalStatus} onChange={(v) => update("rentalStatus", v)} accentColor={ACCENT} icons={RENTAL_ICONS} />
            <RadioGroup stepNumber="18" label="Loan status" options={LOAN_STATUS} value={form.loanStatus} onChange={(v) => update("loanStatus", v)} accentColor={ACCENT} icons={LOAN_ICONS} />
            <RadioGroup stepNumber="19" label="Expected selling price" options={PRICE_RANGES} value={form.expectedPrice} onChange={(v) => update("expectedPrice", v)} accentColor={ACCENT} icons={PRICE_ICONS} />
            <RadioGroup stepNumber="20" label="When are you planning to sell?" options={TIMELINE} value={form.timeline} onChange={(v) => update("timeline", v)} accentColor={ACCENT} icons={TIMELINE_ICONS} />

            <div>
              <label className="field-label">21. Remarks / additional details</label>
              <textarea
                className="field-input min-h-[80px]"
                value={form.sellerRemarks}
                onChange={(e) => update("sellerRemarks", e.target.value)}
                placeholder="Anything else worth mentioning about the property…"
              />
            </div>
          </div>

          {errorMsg && <p className="text-sm text-buyer">{errorMsg}</p>}

          <button type="submit" disabled={status === "saving" || !isComplete} className="btn-primary w-full flex items-center justify-center gap-2">
            {status === "saving" ? "Saving…" : (<>Save &amp; continue to WhatsApp <MessageCircle size={16} /></>)}
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
