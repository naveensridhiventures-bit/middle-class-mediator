import { Link } from "react-router-dom";
import {
  ShieldCheck, ArrowRight, Handshake, Home as HomeIcon, Search,
  Building2, UtensilsCrossed, Store, Building, Briefcase,
  Camera, ClipboardList, MessageCircle, Users, MapPin, BadgeCheck,
  IndianRupee, Zap, Award,
} from "lucide-react";
import Seal from "../components/Seal";
import { APP_NAME } from "../lib/config";

const roles = [
  {
    to: "/mediator",
    label: "Mediator",
    color: "mediator",
    hex: "#2D4373",
    icon: Handshake,
    tag: "Bring the deal",
    desc: "Saw a property on our Insta page? Register your details and we'll connect on WhatsApp.",
    points: ["Register in 2 minutes", "Share WhatsApp details", "Track leads with our team", "Close deals & earn"],
  },
  {
    to: "/seller",
    label: "Seller",
    color: "seller",
    hex: "#1F6F5C",
    icon: HomeIcon,
    tag: "List your property",
    desc: "Share price, location and details of the house or shop you're selling. We follow up directly with you.",
    points: ["Any property type", "Direct owner or agent", "No brokerage confusion", "We follow up for you"],
  },
  {
    to: "/buyer",
    label: "Buyer",
    color: "buyer",
    hex: "#B5533C",
    icon: Search,
    tag: "Register requirement",
    desc: "Tell us your budget, location and property type — we'll contact you with matching properties.",
    points: ["Choose your budget", "Select preferred location", "Property type & purpose", "We match & follow up"],
  },
];

const categories = [
  { label: "Hotels", sub: "Buy · Sell · Lease", icon: Building2, hex: "#2D4373" },
  { label: "Restaurants", sub: "Running / New", hex: "#B5533C", icon: UtensilsCrossed },
  { label: "Shops", sub: "Retail / Commercial", hex: "#1F6F5C", icon: Store },
  { label: "Apartments", sub: "Flats · Villas", hex: "#6D5DB0", icon: Building },
  { label: "Commercial", sub: "Office · Warehouse", hex: "#1F6FA0", icon: Briefcase },
];

const stats = [
  { n: "10,000+", label: "Properties Shared", icon: Building2 },
  { n: "3,500+", label: "Successful Deals", icon: Handshake },
  { n: "600+", label: "Active Mediators", icon: Users },
  { n: "25+", label: "Cities Covered", icon: MapPin },
];

const trustBadges = [
  { label: "Verified Properties", icon: ShieldCheck },
  { label: "No Brokerage Confusion", icon: IndianRupee },
  { label: "Direct Buyer Connection", icon: Users },
  { label: "Expert Mediators", icon: Award },
  { label: "Fast & Easy Deal Closing", icon: Zap },
];

const steps = [
  { n: "01", t: "Spot it on Instagram", d: "You post a property video — a viewer wants in, as mediator, seller or buyer.", icon: Camera },
  { n: "02", t: "They fill their details", d: "Right here in the app — property, price, location, and a photo if they have one.", icon: ClipboardList },
  { n: "03", t: "We take it from WhatsApp", d: "It lands straight to us, and we follow up directly to close the deal.", icon: MessageCircle },
];

export default function Home() {
  return (
    <div className="pb-24 lg:pb-20">
      {/* ---------- Hero ---------- */}
      <section className="max-w-6xl mx-auto px-5 pt-10 sm:pt-14">
        <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold text-gold-dark mb-5">
              <BadgeCheck size={14} />
              Trusted · Verified · Hassle-Free
            </div>
            <h1 className="font-display font-semibold text-4xl sm:text-5xl lg:text-[3.4rem] text-ink tracking-tight leading-[1.08]">
              {APP_NAME}
            </h1>
            <p className="mt-4 text-ink/60 max-w-md leading-relaxed">
              One record for every house, shop or property shared on our Instagram —
              from first message to final handshake.
            </p>

            {/* Category strip — mobile-app style quick filters */}
            <div id="categories" className="flex gap-3 overflow-x-auto no-scrollbar mt-7 pb-1 scroll-mt-24">
              {categories.map((c) => (
                <div key={c.label} className="flex flex-col items-center gap-1.5 shrink-0">
                  <span
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${c.hex}14`, color: c.hex }}
                  >
                    <c.icon size={20} />
                  </span>
                  <span className="text-[11px] font-semibold text-ink/60">{c.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-7">
              <Link to="/seller" className="btn-primary">
                Share Property <ArrowRight size={15} />
              </Link>
              <Link to="/buyer" className="btn-ghost">
                <Search size={15} /> Find Property
              </Link>
            </div>
          </div>

          {/* Right side — checklist card (desktop) */}
          <div className="hidden lg:block">
            <div className="card-ledger p-7 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 opacity-[0.06]">
                <Seal label="Est on trust" size={180} rotate={-8} />
              </div>
              <p className="field-label mb-4">Why people trust us</p>
              <ul className="space-y-3.5 relative">
                {["Direct Connections", "Verified Properties", "Quick Follow-up", "Deal Closing Support"].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-seller/15 text-seller flex items-center justify-center shrink-0">
                      <BadgeCheck size={14} />
                    </span>
                    <span className="text-sm font-medium text-ink/75">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Stats bar ---------- */}
      <section className="max-w-6xl mx-auto px-5 mt-10">
        <div className="bg-ink rounded-2xl px-5 sm:px-8 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-white/10 text-gold-light flex items-center justify-center shrink-0">
                <s.icon size={16} />
              </span>
              <div>
                <p className="font-display font-semibold text-lg sm:text-xl text-paper leading-none">{s.n}</p>
                <p className="text-[11px] text-paper/50 mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Role cards ---------- */}
      <section className="max-w-6xl mx-auto px-5 mt-14">
        <div className="grid sm:grid-cols-3 gap-5">
          {roles.map((r) => (
            <div key={r.to} className="card-ledger p-6 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between">
                <span
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${r.hex}18`, color: r.hex }}
                >
                  <r.icon size={19} />
                </span>
                <span
                  className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-1 rounded-full"
                  style={{ color: r.hex, backgroundColor: `${r.hex}12` }}
                >
                  {r.tag}
                </span>
              </div>
              <div>
                <h2 className="font-display font-semibold text-xl text-ink mb-1.5">{r.label}</h2>
                <p className="text-sm text-ink/60 leading-relaxed">{r.desc}</p>
              </div>
              <ul className="space-y-1.5">
                {r.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-2 text-xs text-ink/55">
                    <BadgeCheck size={13} style={{ color: r.hex }} className="shrink-0" />
                    {pt}
                  </li>
                ))}
              </ul>
              <Link
                to={r.to}
                className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-full text-white font-semibold text-sm px-5 py-2.5 transition hover:brightness-95 active:scale-[0.98]"
                style={{ backgroundColor: r.hex }}
              >
                Continue as {r.label} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-5 mt-14 scroll-mt-24">
        <div className="card-ledger p-6 sm:p-8">
          <p className="field-label mb-4">How it works</p>
          <ol className="grid sm:grid-cols-3 gap-6">
            {steps.map((s) => (
              <li key={s.n} className="flex gap-3">
                <span className="w-9 h-9 rounded-full bg-gold/15 text-gold-dark flex items-center justify-center shrink-0">
                  <s.icon size={16} />
                </span>
                <div>
                  <p className="font-semibold text-ink text-sm mb-1">{s.t}</p>
                  <p className="text-sm text-ink/55 leading-relaxed">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Popular property types ---------- */}
      <section className="max-w-6xl mx-auto px-5 mt-14">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-2xl text-ink">Popular Property Types</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((c) => (
            <div
              key={c.label}
              className="rounded-2xl p-5 flex flex-col gap-3 justify-between aspect-square sm:aspect-auto sm:h-40"
              style={{ backgroundColor: `${c.hex}12` }}
            >
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${c.hex}22`, color: c.hex }}
              >
                <c.icon size={18} />
              </span>
              <div>
                <p className="font-display font-semibold text-ink leading-tight">{c.label}</p>
                <p className="text-xs text-ink/50 mt-0.5">{c.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Trust badges strip ---------- */}
      <section id="about" className="max-w-6xl mx-auto px-5 mt-14 scroll-mt-24">
        <div className="card-ledger px-6 py-5 flex flex-wrap gap-x-8 gap-y-4 justify-center sm:justify-between">
          {trustBadges.map((b) => (
            <div key={b.label} className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-gold/12 text-gold-dark flex items-center justify-center shrink-0">
                <b.icon size={15} />
              </span>
              <span className="text-xs font-semibold text-ink/65">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Contact / footer note ---------- */}
      <section id="contact" className="max-w-6xl mx-auto px-5 mt-14 scroll-mt-24">
        <div className="text-center text-xs text-ink/40">
          Have a question? Reach us the same way everyone else does —{" "}
          <a href="/buyer" className="font-semibold text-ink/60 underline underline-offset-2">
            register a requirement
          </a>{" "}
          and we'll get back to you on WhatsApp.
        </div>
      </section>
    </div>
  );
}
