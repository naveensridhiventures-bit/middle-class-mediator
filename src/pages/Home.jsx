import { Link } from "react-router-dom";
import {
  Handshake, User, Search, Building2, Home as HomeIcon, Building, TreePine,
} from "lucide-react";
import ImageSlot from "../components/ImageSlot";

const categories = [
  { label: "Hotel", src: "category-hotel.jpg", icon: Building2, gradient: "linear-gradient(135deg,#1B2A4A,#2D4373)" },
  { label: "Home", src: "category-home.jpg", icon: HomeIcon, gradient: "linear-gradient(135deg,#1F6F5C,#2E9C82)" },
  { label: "Flats", src: "category-flats.jpg", icon: Building, gradient: "linear-gradient(135deg,#2D4373,#5B6FA8)" },
  { label: "Lands", src: "category-lands.jpg", icon: TreePine, gradient: "linear-gradient(135deg,#3D6B3A,#6FA85E)" },
];

const roles = [
  {
    to: "/seller",
    title: "SELLER",
    icon: User,
    desc: "List your property and connect with genuine buyers.",
    from: "#1B2A4A",
    to2: "#2D4373",
    underline: "#5B7BD8",
  },
  {
    to: "/buyer",
    title: "BUYER",
    icon: Search,
    desc: "Find the best properties that match your needs.",
    from: "#14453A",
    to2: "#1F6F5C",
    underline: "#3FBE9C",
  },
  {
    to: "/mediator",
    title: "MEDIATOR",
    icon: Handshake,
    desc: "Connect buyers and sellers and close better deals.",
    from: "#2E1D52",
    to2: "#4C2E8C",
    underline: "#B79CF2",
  },
];

export default function Home() {
  return (
    <div className="bg-ink">
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-ink bg-grain bg-grain">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-14 pb-16 lg:pt-20 lg:pb-24 relative grid lg:grid-cols-[1fr,1.15fr] gap-12 items-center">
          {/* Left — logo, name, tagline */}
          <div>
            <div className="relative w-20 h-20 mb-9">
              <div className="w-20 h-20 rounded-full border-2 border-gold flex items-center justify-center">
                <span className="font-display font-bold text-gold text-lg tracking-wide">MCM</span>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gold flex items-center justify-center shadow-md">
                <Handshake size={14} className="text-ink" strokeWidth={2.5} />
              </div>
            </div>

            <h1 className="font-display font-bold text-gold text-[2.6rem] sm:text-6xl lg:text-[3.6rem] leading-[1.05] tracking-tight">
              Middle Class
              <br />
              Mediator
            </h1>

            <p className="text-paper/70 text-sm sm:text-base mt-5 max-w-sm leading-relaxed">
              Trusted Mediation. Better Deals. Stronger Connections.
            </p>

            <div className="flex items-center gap-3 mt-6">
              <span className="h-px w-10 bg-gold/40" />
              <span className="w-1.5 h-1.5 rotate-45 bg-gold" />
              <span className="h-px w-10 bg-gold/40" />
            </div>
          </div>

          {/* Right — hero visual: skyline + restaurant panel */}
          <div className="relative h-[320px] sm:h-[420px] lg:h-[460px]">
            <div
              className="absolute inset-0 rounded-[3rem] overflow-hidden shadow-2xl"
              style={{ background: "linear-gradient(200deg,#3A2E1A 0%,#7A5A2E 35%,#C89B3C 60%,#2D4373 100%)" }}
            >
              <ImageSlot
                src="hero-skyline.jpg"
                alt="Looking out over the city skyline"
                className="w-full h-full"
              />
            </div>
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 w-[46%] sm:w-[42%] aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border-2 border-white/10">
              <div className="absolute top-0 inset-x-0 bg-ink/90 text-paper text-[10px] sm:text-xs font-display font-semibold tracking-[0.15em] uppercase text-center py-1.5 z-10">
                Restaurant
              </div>
              <ImageSlot
                src="hero-restaurant.jpg"
                alt="Restaurant interior"
                icon={Building2}
                gradient="linear-gradient(135deg,#3D2B1B,#6B4A2A)"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* ---------- Category strip ---------- */}
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-16 lg:pb-20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
            {categories.map((c) => (
              <div key={c.label} className="rounded-2xl overflow-hidden shadow-lg border border-white/10">
                <div className="bg-ink-dark text-paper text-xs sm:text-sm font-display font-semibold tracking-[0.1em] uppercase text-center py-2 border-b border-gold/20">
                  {c.label}
                </div>
                <div className="aspect-[4/3]">
                  <ImageSlot
                    src={c.src}
                    alt={c.label}
                    icon={c.icon}
                    gradient={c.gradient}
                    className="w-full h-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Role cards ---------- */}
      <section className="bg-paper">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 lg:py-20">
          <div className="grid sm:grid-cols-3 gap-6">
            {roles.map((r) => (
              <Link
                key={r.to}
                to={r.to}
                className="group rounded-3xl p-8 flex flex-col items-center text-center gap-4 shadow-lg hover:-translate-y-1.5 hover:shadow-2xl transition-all"
                style={{ background: `linear-gradient(160deg, ${r.from}, ${r.to2})` }}
              >
                <span className="w-16 h-16 rounded-full bg-white/12 flex items-center justify-center group-hover:bg-white/20 transition">
                  <r.icon size={26} className="text-white" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-display font-bold text-white text-sm tracking-[0.15em]">I'M A</p>
                  <h2 className="font-display font-bold text-white text-2xl sm:text-[1.7rem] tracking-tight -mt-0.5">
                    {r.title}
                  </h2>
                </div>
                <p className="text-white/70 text-sm leading-relaxed max-w-[220px]">{r.desc}</p>
                <span className="h-0.5 w-10 rounded-full mt-1" style={{ backgroundColor: r.underline }} />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
