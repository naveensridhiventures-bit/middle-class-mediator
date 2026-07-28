import { Link } from "react-router-dom";
import { Handshake, User, Search } from "lucide-react";

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
      {/* ---------- Hero — real banner photo, sized to its own aspect ratio ---------- */}
      <section className="relative overflow-hidden bg-ink" style={{ aspectRatio: "1535 / 1024" }}>
        <img
          src="/images/hero-banner.jpg"
          alt="Middle Class Mediator — trusted mediation for hotels, homes, flats and lands"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Safety gradient so the logo/text stay legible on any screen size */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/25 to-transparent pointer-events-none" />

        <div className="relative h-full max-w-7xl mx-auto px-6 lg:px-10 flex items-center">
          <div className="max-w-sm">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-6 sm:mb-9">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-gold flex items-center justify-center">
                <span className="font-display font-bold text-gold text-base sm:text-lg tracking-wide">MCM</span>
              </div>
              <div className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gold flex items-center justify-center shadow-md">
                <Handshake size={13} className="text-ink" strokeWidth={2.5} />
              </div>
            </div>

            <h1 className="font-display font-bold text-gold text-3xl sm:text-5xl lg:text-[3.4rem] leading-[1.05] tracking-tight">
              Middle Class
              <br />
              Mediator
            </h1>

            <p className="text-paper/75 text-xs sm:text-base mt-3 sm:mt-5 leading-relaxed">
              Trusted Mediation. Better Deals. Stronger Connections.
            </p>

            <div className="flex items-center gap-3 mt-4 sm:mt-6">
              <span className="h-px w-8 sm:w-10 bg-gold/40" />
              <span className="w-1.5 h-1.5 rotate-45 bg-gold" />
              <span className="h-px w-8 sm:w-10 bg-gold/40" />
            </div>
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
