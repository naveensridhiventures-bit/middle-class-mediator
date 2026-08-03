import { useState } from "react";
import {
  User, MessageCircle, Handshake, Building2, HardHat, LandPlot, MapPin,
  Landmark, Home as HomeIcon, Briefcase, Key, CalendarRange, ShoppingBag,
  Repeat, FileText, Layers, CheckCircle2, XCircle, ShieldCheck,
} from "lucide-react";
import Seal from "../components/Seal";
import RadioGroup from "../components/RadioGroup";
import { addMediatorLead } from "../lib/api";

const ACCENT = "#2D4373";

const PROFESSIONS = ["Mediator", "Real Estate Agent", "Builder", "Developer"];
const AREAS = ["North Chennai", "Central Chennai", "South Chennai", "All Over Chennai"];
const CATEGORIES = ["Residential", "Commercial", "Land", "Rental", "All Categories"];
const EXPERIENCE = ["Below 1 Year", "1–3 Years", "3–5 Years", "Above 5 Years"];
const DEAL_TYPES = ["Sale", "Rental", "Lease", "All"];
const YES_NO = ["Yes", "No"];

const PROFESSION_ICONS = { Mediator: Handshake, "Real Estate Agent": Briefcase, Builder: HardHat, Developer: Building2 };
const AREA_ICONS = Object.fromEntries(AREAS.map((a) => [a, a === "All Over Chennai" ? Landmark : MapPin]));
const CATEGORY_ICONS = { Residential: HomeIcon, Commercial: Building2, Land: LandPlot, Rental: Key, "All Categories": Layers };
const EXPERIENCE_ICONS = Object.fromEntries(EXPERIENCE.map((e) => [e, CalendarRange]));
const DEAL_TYPE_ICONS = { Sale: ShoppingBag, Rental: Repeat, Lease: FileText, All: Layers };
const YES_NO_ICONS = { Yes: CheckCircle2, No: XCircle };

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

  if (status === "done") {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-5 py-16">
        <div className="max-w-md w-full text-center">
          <Seal label="Received" color={ACCENT} size={80} rotate={-10} />
          <h1 className="font-display font-semibold text-2xl text-ink mt-5 mb-2">
            Your report has been submitted
          </h1>
          <p className="text-ink/60 mb-7 leading-relaxed">
            Thanks <strong>{form.name}</strong> — your registration is logged as a report for
            our team. We review every submission and will get in touch directly.
          </p>
          <a href="/mediator" className="btn-ghost w-full">
            Register another
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
            <p className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: ACCENT }}>Chennai Mediator Network</p>
            <span className="h-px w-8" style={{ backgroundColor: `${ACCENT}40` }} />
          </div>
          <h1 className="font-display font-bold text-3xl text-ink">Registration form</h1>
          <p className="text-ink/50 text-sm mt-1.5">Join our verified mediator network</p>
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
            <RadioGroup stepNumber="1" label="Your profession" options={PROFESSIONS} value={form.profession} onChange={(v) => update("profession", v)} accentColor={ACCENT} icons={PROFESSION_ICONS} />
            <RadioGroup stepNumber="2" label="Working area" options={AREAS} value={form.workingArea} onChange={(v) => update("workingArea", v)} accentColor={ACCENT} icons={AREA_ICONS} />
            <RadioGroup stepNumber="3" label="Property category" options={CATEGORIES} value={form.propertyCategory} onChange={(v) => update("propertyCategory", v)} accentColor={ACCENT} icons={CATEGORY_ICONS} />
            <RadioGroup stepNumber="4" label="Experience" options={EXPERIENCE} value={form.experience} onChange={(v) => update("experience", v)} accentColor={ACCENT} icons={EXPERIENCE_ICONS} />
            <RadioGroup stepNumber="5" label="Deal type" options={DEAL_TYPES} value={form.dealType} onChange={(v) => update("dealType", v)} accentColor={ACCENT} icons={DEAL_TYPE_ICONS} />
            <RadioGroup stepNumber="6" label="Do you share only genuine property leads?" options={YES_NO} value={form.genuineLeads} onChange={(v) => update("genuineLeads", v)} accentColor={ACCENT} icons={YES_NO_ICONS} />
          </div>

          {errorMsg && <p className="text-sm text-buyer">{errorMsg}</p>}

          <button type="submit" disabled={status === "saving" || !isComplete} className="btn-primary w-full flex items-center justify-center gap-2">
            {status === "saving" ? "Saving…" : (
              <>
                Submit report
                <Handshake size={16} />
              </>
            )}
          </button>
          <p className="text-xs text-ink/40 leading-relaxed flex items-start gap-1.5">
            <ShieldCheck size={13} className="shrink-0 mt-0.5" />
            This submits your details as a report. Our team will review it and get in touch.
          </p>
        </form>
      </div>
    </div>
  );
}
