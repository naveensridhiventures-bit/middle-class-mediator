import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Handshake, User, Search, Image as ImageIcon, ChevronRight, MessageCircle, ArrowRight, Lock, UserCheck, ClipboardCheck } from "lucide-react";
import Reveal from "../components/Reveal";
import RotatingWords from "../components/home/RotatingWords";
import Particles from "../components/home/Particles";
import Ticker from "../components/home/Ticker";
import SearchDock from "../components/home/SearchDock";
import FreshRail from "../components/home/FreshRail";
import LiveStats from "../components/home/LiveStats";
import useTilt from "../components/home/useTilt";
import useProperties from "../lib/useProperties";
import useInView from "../lib/useInView";
import { whatsappLink } from "../lib/whatsapp";
import { ADMIN_WHATSAPP_NUMBER } from "../lib/config";
import { HERO_IMAGE } from "../lib/brand";


const ROLE_WORDS = ["buy a home.", "sell a flat.", "find a plot.", "list a shop.", "close a deal."];

const ROLES = [
  {
    to: "/seller",
    title: "I'm a seller",
    desc: "List your property and connect with genuine buyers.",
    Icon: User,
    tile: "#145A57",
    bg: "#E3F0EC",
    titleColor: "#0F4F4B",
    chevBg: "#BFDDD6",
  },
  {
    to: "/buyer",
    title: "I'm a buyer",
    desc: "Tell us what you need and we'll find matching properties.",
    Icon: Search,
    tile: "#E5584A",
    bg: "#FDE4E1",
    titleColor: "#8E1F1F",
    chevBg: "#F8BDB7",
  },
  {
    to: "/mediator",
    title: "I'm a mediator",
    desc: "Join the network and close better deals.",
    Icon: Handshake,
    tile: "#0F4C8A",
    bg: "#DCEAF8",
    titleColor: "#0B4A80",
    chevBg: "#B3D0EF",
  },
];

const STEPS = [
  { title: "Tell us what you need", text: "Fill in a short form. It takes about a minute." },
  { title: "We review and match", text: "Our team looks at every request and contacts you with matching properties." },
  { title: "Talk to us on WhatsApp", text: "Ask questions and move ahead, with a real person on the other end." },
];

function RoleCard({ role }) {
  const { to, title, desc, Icon, tile, bg, titleColor, chevBg } = role;
  const tilt = useTilt(5);
  return (
    <Link
      to={to}
      {...tilt}
      className="role-card group relative h-full overflow-hidden flex items-center gap-3 sm:gap-4 rounded-3xl p-3.5 sm:p-5 md:flex-col md:items-start md:gap-5 md:p-6 md:pb-[4.75rem] shadow-[0_10px_28px_-14px_rgba(27,42,74,0.35)] active:scale-[0.985] transition-transform"
      style={{ background: bg, "--tile": tile }}
    >
      <span className="sheen" aria-hidden="true" />
      <span
        className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
        style={{ background: tile }}
      >
        <Icon size={26} strokeWidth={2.2} />
      </span>
      <span className="relative flex-1 min-w-0">
        <span className="block font-display font-bold text-[1.3rem] sm:text-[1.4rem] leading-tight" style={{ color: titleColor }}>
          {title}
        </span>
        <span className="block text-[13.5px] sm:text-[14px] leading-snug text-ink/65 mt-1">{desc}</span>
      </span>
      <span
        className="relative w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 group-hover:!bg-[color:var(--tile)] group-hover:!text-white md:absolute md:right-5 md:bottom-5"
        style={{ background: chevBg, color: tile }}
        aria-hidden="true"
      >
        <ChevronRight size={22} strokeWidth={2.6} />
      </span>
    </Link>
  );
}

const WHY = [
  { Icon: ClipboardCheck, title: "Read by our team", text: "Every request and listing is reviewed by a person before anything happens.", tint: "#145A57" },
  { Icon: Lock, title: "Your details stay private", text: "Listings never show a seller's phone number or exact address.", tint: "#0F4C8A" },
  { Icon: UserCheck, title: "A real person on WhatsApp", text: "Ask questions, share requirements and move ahead without a call centre.", tint: "#B5452F" },
];

function WhyUs() {
  return (
    <section className="mt-14" aria-labelledby="why-title">
      <h2 id="why-title" className="font-display font-bold text-[1.6rem] sm:text-3xl leading-tight text-center text-ink">Why people use us</h2>
      <div className="mt-7 grid gap-3.5 md:grid-cols-3">
        {WHY.map(({ Icon, title, text, tint }, i) => (
          <Reveal key={title} delay={i * 110} distance={24} className="h-full">
            <div className="why-card h-full rounded-3xl bg-surface ring-1 ring-ink/[0.06] p-5 shadow-[0_14px_30px_-22px_rgba(27,42,74,0.5)] hover:shadow-[0_22px_40px_-20px_rgba(27,42,74,0.5)] transition-shadow">
              <span className="why-ico w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: tint }}>
                <Icon size={23} strokeWidth={2} />
              </span>
              <h3 className="mt-4 font-display font-bold text-[1.15rem] text-ink leading-snug">{title}</h3>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink/60">{text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <Reveal distance={30} className="mt-16">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-ink-dark text-white px-6 py-10 sm:px-12 sm:py-14 text-center shadow-[0_28px_60px_-28px_rgba(10,17,36,0.85)]">
        <span className="cta-orb absolute -z-10 -top-24 -right-16 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(224,183,92,0.35),transparent_68%)]" aria-hidden="true" />
        <span className="cta-orb absolute -z-10 -bottom-28 -left-20 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(229,88,74,0.25),transparent_68%)]" style={{ animationDelay: "-4s" }} aria-hidden="true" />
        <h2 className="font-display font-bold text-[1.8rem] sm:text-4xl leading-tight text-balance">Ready to buy, sell or join the network?</h2>
        <p className="mt-3 text-white/65 text-[15px] sm:text-lg max-w-md mx-auto text-balance">Fill in a short form. We read every request and reply on WhatsApp.</p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/buyer" className="rip btn-shine h-13 py-3.5 px-8 rounded-full bg-[#C99A4A] text-ink-dark font-bold text-[15px] flex items-center justify-center gap-2 active:scale-95 transition-transform">
            Tell us what you need <ArrowRight size={18} />
          </Link>
          <Link to="/seller" className="rip py-3.5 px-8 rounded-full border border-white/30 text-white font-semibold text-[15px] flex items-center justify-center hover:bg-white/10 active:scale-95 transition">
            List my property
          </Link>
        </div>
      </section>
    </Reveal>
  );
}

function HowItWorks() {
  const ref = useRef(null);
  const seen = useInView(ref, { threshold: 0.3 });
  return (
    <section ref={ref} className={`mt-14 ${seen ? "is-in" : ""}`} aria-labelledby="how-title">
      <h2 id="how-title" className="font-display font-bold text-[1.6rem] leading-tight text-center text-ink">
        How it works
      </h2>
      <p className="text-center text-sm text-ink/55 mt-1.5">Three simple steps, whichever side you're on.</p>

      <ol className="relative mt-8 max-w-md mx-auto">
        <span className="steps-line absolute left-[1.35rem] top-6 bottom-6 w-[2px] bg-gradient-to-b from-gold via-gold/60 to-gold/10" aria-hidden="true" />
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative flex gap-4 pb-8 last:pb-0" style={{ "--i": i }}>
            <span className="step-badge relative z-10 w-11 h-11 shrink-0 rounded-full bg-ink text-gold font-display font-bold text-lg flex items-center justify-center ring-4 ring-canvas">
              {i + 1}
            </span>
            <div className="step-text pt-1">
              <h3 className="font-display font-bold text-[1.1rem] text-ink leading-snug">{s.title}</h3>
              <p className="text-sm text-ink/60 leading-relaxed mt-1">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function Home() {
  const heroRef = useRef(null);
  const { properties, error } = useProperties();
  const hasListings = !!properties && properties.some((p) => !p.sold && p.images.length > 0);
  const [showChat, setShowChat] = useState(false);

  // Parallax: the photo drifts slower than the page, the text lifts and fades
  // as you scroll away. We only write a CSS variable, so React never re-renders.
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (!reduce) heroRef.current?.style.setProperty("--py", String(Math.min(y, 700)));
        setShowChat(y > 380);
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="bg-ink-dark">
      {/* ---------- Hero ---------- */}
      <section
        ref={heroRef}
        className="relative isolate overflow-hidden min-h-[33rem] sm:min-h-[38rem] flex flex-col text-center"
      >
        <div className="hero-bg absolute inset-0 -z-10" aria-hidden="true">
          <img
            src={HERO_IMAGE}
            alt=""
            className="hero-photo w-full h-full object-cover object-[72%_40%] sm:object-center"
            decoding="async"
            fetchpriority="high"
          />
        </div>
        {/* Darkening so the words always read clearly over the photo */}
        <div
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(10,17,36,0.42)_0%,rgba(10,17,36,0.70)_45%,rgba(10,17,36,0.94)_100%)]"
          aria-hidden="true"
        />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_38%,rgba(200,155,60,0.16),transparent_62%)]" aria-hidden="true" />
        <Particles />

        <div className="hero-content flex-1 flex flex-col items-center justify-center px-5 pt-[max(3rem,env(safe-area-inset-top))] pb-14">
          {/* Logo: gold ring, slow orbit, soft pulsing glow */}
          <div className="logo-in relative w-[7.25rem] h-[7.25rem] sm:w-32 sm:h-32">
            <span className="orbit absolute -inset-3 rounded-full border border-dashed border-gold/45" aria-hidden="true">
              <span className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_10px_2px_rgba(224,183,92,0.9)]" />
            </span>
            <div className="ring-glow absolute inset-0 rounded-full border-2 border-gold bg-ink/85 flex flex-col items-center justify-center">
              <span className="font-display font-semibold text-gold text-[2rem] sm:text-[2.25rem] leading-none tracking-tight">MCM</span>
              <Handshake size={22} className="text-gold mt-1.5" strokeWidth={2} />
            </div>
          </div>

          {/* Title: each word rises out of a mask; "Mediator" carries a gold shimmer */}
          <h1 className="mt-7 font-display font-bold text-white text-[2.1rem] leading-[1.1] sm:text-6xl tracking-tight text-balance" aria-label="Middle Class Mediator">
            <span aria-hidden="true">
              <span className="mask-word"><span className="mask-inner" style={{ "--d": "250ms" }}>Middle</span></span>{" "}
              <span className="mask-word"><span className="mask-inner" style={{ "--d": "370ms" }}>Class</span></span>{" "}
              <span className="mask-word"><span className="mask-inner gold-shimmer" style={{ "--d": "520ms" }}>Mediator</span></span>
            </span>
          </h1>

          {/* Rolling words */}
          <p className="fade-up mt-5 text-paper/80 text-[15px] sm:text-lg" style={{ "--d": "850ms" }}>
            The trusted way to
          </p>
          <p className="fade-up font-display font-semibold text-gold text-[1.7rem] sm:text-4xl leading-tight mt-1" style={{ "--d": "980ms" }}>
            <RotatingWords words={ROLE_WORDS} />
          </p>

          {/* Tagline, one phrase at a time */}
          <p className="mt-5 text-paper/75 text-[13px] sm:text-base leading-relaxed text-balance">
            <span className="fade-up inline-block" style={{ "--d": "1250ms" }}>Trusted Mediation.</span>{" "}
            <span className="fade-up inline-block" style={{ "--d": "1450ms" }}>Better Deals.</span>{" "}
            <span className="fade-up inline-block" style={{ "--d": "1650ms" }}>Stronger Connections.</span>
          </p>

          {/* Divider draws outward from the diamond */}
          <div className="mt-6 flex items-center gap-3" aria-hidden="true">
            <span className="line-grow origin-right h-px w-16 sm:w-24 bg-gradient-to-r from-transparent to-gold/80" />
            <span className="diamond-in w-2.5 h-2.5 rotate-45 border border-gold" />
            <span className="line-grow origin-left h-px w-16 sm:w-24 bg-gradient-to-l from-transparent to-gold/80" />
          </div>

          <div className="cta-in mt-7 flex flex-wrap items-center justify-center gap-3" style={{ "--d": "1900ms" }}>
            <Link to="/gallery" className="rip btn-shine h-12 px-7 rounded-full bg-[#C99A4A] text-ink-dark font-bold text-[14.5px] flex items-center gap-2 active:scale-95 transition-transform shadow-[0_12px_28px_-10px_rgba(201,154,74,0.9)]">
              Browse properties <ArrowRight size={17} />
            </Link>
            <a
              href={whatsappLink(ADMIN_WHATSAPP_NUMBER, "Hi, I'd like to know more about Middle Class Mediator.")}
              target="_blank"
              rel="noreferrer"
              className="rip h-12 px-6 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-white font-semibold text-[14.5px] flex items-center gap-2 hover:bg-white/20 active:scale-95 transition"
            >
              <MessageCircle size={18} /> Chat with us
            </a>
          </div>
        </div>

        <div className="mb-24 sm:mb-28">
          <Ticker />
        </div>
      </section>

      {/* ---------- Cream sheet rising over the hero ---------- */}
      <section className="relative z-10 -mt-8 bg-canvas rounded-t-[2rem] pt-9 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-5">
          <div className="relative z-20 -mt-[5.25rem] sm:-mt-[6rem] mb-2">
            <SearchDock properties={properties} />
          </div>
          <FreshRail properties={properties} />
          <LiveStats properties={properties} />

          <Reveal direction="up" distance={14} className="mt-14">
            <h2 className="font-display font-bold text-[1.75rem] sm:text-4xl leading-tight text-center text-ink">
              How can we help you today?
            </h2>
            <p className="text-center text-[15px] text-ink/60 mt-2">Pick the option that fits you. It only takes a minute.</p>
          </Reveal>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {ROLES.map((role, i) => (
              <Reveal key={role.to} delay={i * 110} distance={26} className="h-full">
                <RoleCard role={role} />
              </Reveal>
            ))}
          </div>

          {(error || (properties && !hasListings)) && (
          <Reveal delay={120} distance={26} className="mt-4">
            <Link
              to="/gallery"
              className="gallery-card group relative isolate overflow-hidden flex items-center gap-3 sm:gap-4 rounded-3xl bg-ink-dark p-3.5 sm:p-5 text-white shadow-[0_14px_32px_-14px_rgba(10,17,36,0.7)] active:scale-[0.985] transition-transform"
            >
              <img
                src={HERO_IMAGE}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 -z-10 w-full h-full object-cover object-[80%_88%] opacity-50 transition-transform duration-[1600ms] ease-out group-hover:scale-110"
                loading="lazy"
              />
              <span className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-dark via-ink-dark/85 to-ink-dark/25" aria-hidden="true" />
              <span className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl border border-white/25 bg-white/5 flex items-center justify-center transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                <ImageIcon size={26} strokeWidth={2} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-display font-bold text-[1.2rem] sm:text-[1.3rem] leading-tight text-balance">Browse the property gallery</span>
                <span className="block text-[13.5px] sm:text-[14px] text-white/70 mt-1">See listings shared by our sellers.</span>
              </span>
              <span
                className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-full bg-white/15 flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white group-hover:text-ink"
                aria-hidden="true"
              >
                <ChevronRight size={22} strokeWidth={2.6} />
              </span>
            </Link>
          </Reveal>
          )}

          <WhyUs />
          <HowItWorks />
          <FinalCta />

          <nav className="mt-14 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[14px] font-semibold text-ink/65" aria-label="Footer">
            <Link to="/gallery" className="hover:text-ink">Property gallery</Link>
            <Link to="/seller" className="hover:text-ink">Sell a property</Link>
            <Link to="/buyer" className="hover:text-ink">Buy a property</Link>
            <Link to="/mediator" className="hover:text-ink">Join as mediator</Link>
          </nav>
          <p className="text-center text-xs text-ink/45 mt-5">
            © {new Date().getFullYear()} Middle Class Mediator. Trusted mediation for Chennai properties.
          </p>
        </div>
      </section>

      {/* WhatsApp button — appears once you've scrolled past the hero */}
      <a
        href={whatsappLink(ADMIN_WHATSAPP_NUMBER, "Hi, I'd like to know more about Middle Class Mediator.")}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with us on WhatsApp"
        tabIndex={showChat ? 0 : -1}
        className={`chat-fab fixed right-4 z-30 w-14 h-14 rounded-full bg-whatsapp text-white flex items-center justify-center shadow-[0_10px_24px_-6px_rgba(37,211,102,0.7)] transition-all duration-500 ${
          showChat ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
        }`}
        style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <span className="chat-pulse absolute inset-0 rounded-full bg-whatsapp" aria-hidden="true" />
        <MessageCircle size={26} className="relative" />
      </a>
    </div>
  );
}
