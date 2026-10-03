import { Link } from "react-router-dom";
import { Handshake, User, Search, Image as ImageIcon, ChevronDown, ArrowRight } from "lucide-react";
import Reveal from "../components/Reveal";
import { COLORS } from "../lib/theme";

const roles = [
  {
    to: "/seller",
    title: "I'm a seller",
    icon: User,
    desc: "List your property and connect with genuine buyers.",
    color: COLORS.teal,
  },
  {
    to: "/buyer",
    title: "I'm a buyer",
    icon: Search,
    desc: "Tell us what you need and we'll find matching properties.",
    color: COLORS.coral,
  },
  {
    to: "/mediator",
    title: "I'm a mediator",
    icon: Handshake,
    desc: "Join the network and close better deals.",
    color: COLORS.steel,
  },
];

export default function Home() {
  return (
    <div className="bg-ink">
      {/* ---------- Hero — real banner photo ---------- */}
      {/* Mobile: height grows to fit the text (never clips it). From sm up: locked to the photo's own aspect ratio so the full image shows. */}
      <section className="relative overflow-hidden bg-ink min-h-[420px] sm:min-h-0 sm:aspect-[1535/1024]">
        <img
          src="/images/hero-banner.jpg"
          alt="Middle Class Mediator — trusted mediation for hotels, homes, flats and lands"
          className="absolute inset-0 w-full h-full object-cover object-left sm:object-center"
        />
        {/* Safety gradient so the logo/text stay legible on any screen size */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/55 to-ink/15 sm:to-transparent pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 flex items-center py-10 sm:py-0 sm:h-full">
          <Reveal className="max-w-sm" direction="up" distance={22}>
            <div className="relative w-14 h-14 sm:w-20 sm:h-20 mb-5 sm:mb-9">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border-2 border-gold flex items-center justify-center">
                <span className="font-display font-bold text-gold text-sm sm:text-lg tracking-wide">MCM</span>
              </div>
              <div className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gold flex items-center justify-center shadow-md">
                <Handshake size={11} className="text-ink" strokeWidth={2.5} />
              </div>
            </div>

            <h1 className="font-display font-bold text-gold text-[1.9rem] leading-[1.1] sm:text-5xl lg:text-[3.4rem] sm:leading-[1.05] tracking-tight">
              Middle Class
              <br />
              Mediator
            </h1>

            <p className="text-paper/80 text-sm sm:text-base mt-3 sm:mt-5 leading-relaxed">
              Trusted Mediation. Better Deals. Stronger Connections.
            </p>

            <div className="flex items-center gap-3 mt-4 sm:mt-6">
              <span className="h-px w-8 sm:w-10 bg-gold/40" />
              <span className="w-1.5 h-1.5 rotate-45 bg-gold" />
              <span className="h-px w-8 sm:w-10 bg-gold/40" />
            </div>
          </Reveal>
        </div>

        {/* Scroll cue — subtle nudge that there's more below the fold */}
        <div className="hidden sm:flex absolute bottom-5 left-1/2 -translate-x-1/2 flex-col items-center gap-1 text-paper/50 animate-bounce">
          <ChevronDown size={20} />
        </div>
      </section>

      {/* ---------- Role picker — a cream sheet that rises over the hero ---------- */}
      <section className="relative z-10 -mt-8 sm:-mt-16 bg-canvas rounded-t-[2rem] pt-8 pb-10">
        <div className="max-w-3xl mx-auto px-5">
          <h2 className="font-display font-bold text-[1.6rem] leading-tight text-ink">How can we help you today?</h2>
          <p className="text-sm text-ink/55 mt-1.5">Pick the option that fits you. It only takes a minute.</p>

          <div className="mt-6 grid sm:grid-cols-3 gap-3">
            {roles.map((r) => (
              <Link
                key={r.to}
                to={r.to}
                className="group flex sm:flex-col items-center sm:items-start gap-4 rounded-2xl bg-surface border-2 p-5 transition-shadow hover:shadow-md"
                style={{ borderColor: `color-mix(in srgb, ${r.color} 45%, white)` }}
              >
                <span className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: r.color }}>
                  <r.icon size={22} strokeWidth={2} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-display font-bold text-lg text-ink">{r.title}</span>
                  <span className="block text-sm text-ink/60 leading-snug mt-0.5">{r.desc}</span>
                </span>
                <ArrowRight size={18} className="text-ink/30 shrink-0 sm:hidden" />
              </Link>
            ))}
          </div>

          <Link
            to="/gallery"
            className="mt-3 flex items-center gap-4 rounded-2xl bg-ink text-white p-5 hover:bg-ink-light transition-colors"
          >
            <span className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <ImageIcon size={22} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-display font-bold text-lg">Browse the property gallery</span>
              <span className="block text-sm text-white/65 mt-0.5">See listings shared by our sellers.</span>
            </span>
            <ArrowRight size={18} className="text-white/50 shrink-0" />
          </Link>

          <p className="text-center text-xs text-ink/40 mt-8">
            © {new Date().getFullYear()} Middle Class Mediator. Trusted mediation for Chennai properties.
          </p>
        </div>
      </section>
    </div>
  );
}
