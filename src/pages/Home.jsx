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
          <div className="max-w-sm">
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
          </div>
        </div>
      </section>

      {/* ---------- Role cards — float up over the hero photo's floor ---------- */}
      <section className="relative z-10 -mt-8 sm:-mt-24 lg:-mt-28 pb-10 sm:pb-14 lg:pb-20">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "linear-gradient(to bottom, transparent, #111B33 30%, #111B33)" }}
        />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10">
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            {roles.map((r) => (
              <Link
                key={r.to}
                to={r.to}
                className="group rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center gap-2.5 sm:gap-4 shadow-2xl hover:-translate-y-1.5 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] transition-all"
                style={{ background: `linear-gradient(160deg, ${r.from}, ${r.to2})` }}
              >
                <span className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/12 flex items-center justify-center group-hover:bg-white/20 transition">
                  <r.icon size={20} className="sm:hidden text-white" strokeWidth={1.75} />
                  <r.icon size={26} className="hidden sm:block text-white" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-display font-bold text-white text-xs sm:text-sm tracking-[0.15em]">I'M A</p>
                  <h2 className="font-display font-bold text-white text-xl sm:text-2xl lg:text-[1.7rem] tracking-tight -mt-0.5">
                    {r.title}
                  </h2>
                </div>
                <p className="text-white/70 text-xs sm:text-sm leading-relaxed max-w-[240px] sm:max-w-[220px]">{r.desc}</p>
                <span className="h-0.5 w-10 rounded-full mt-0.5 sm:mt-1" style={{ backgroundColor: r.underline }} />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
