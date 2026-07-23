import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MapPin, Bell, Menu, X, ChevronDown } from "lucide-react";
import { APP_NAME } from "../lib/config";

const NAV_LINKS = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Categories", href: "/#categories" },
  { label: "About Us", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

export default function Header() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-paper/90 border-b border-ink/10">
      <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 group shrink-0" onClick={() => setMenuOpen(false)}>
          <span className="w-9 h-9 rounded-full border-2 border-ink flex items-center justify-center font-display font-bold text-ink text-sm group-hover:bg-ink group-hover:text-paper transition">
            MCM
          </span>
          <span className="font-display font-semibold text-lg tracking-tight text-ink hidden sm:block">
            {APP_NAME}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="text-sm font-medium text-ink/60 hover:text-ink transition">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop right side */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <Link to="/buyer" className="btn-primary !py-2.5 !px-5 text-sm">
            Get Started →
          </Link>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="More"
            className="w-9 h-9 rounded-full border-2 border-ink/15 flex items-center justify-center text-ink/60 hover:border-ink/40 hover:text-ink transition"
          >
            <Menu size={16} />
          </button>
        </div>

        {/* Mobile right side — location pill + notification bell (matches app UI) */}
        <div className="flex lg:hidden items-center gap-2 shrink-0">
          <button className="flex items-center gap-1 text-xs font-semibold text-ink/70 bg-white/70 border border-ink/10 rounded-full pl-2.5 pr-2 py-1.5">
            <MapPin size={13} className="text-gold-dark" />
            All India
            <ChevronDown size={12} />
          </button>
          <button aria-label="Notifications" className="relative w-8 h-8 rounded-full border border-ink/10 bg-white/70 flex items-center justify-center text-ink/60">
            <Bell size={15} />
            <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-buyer" />
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            className="w-8 h-8 rounded-full border border-ink/10 bg-white/70 flex items-center justify-center text-ink/60"
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-ink/10 bg-paper/95 px-5 py-4 space-y-3">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-semibold text-ink/70 hover:text-ink"
            >
              {l.label}
            </a>
          ))}
          {pathname !== "/" && (
            <Link to="/" onClick={() => setMenuOpen(false)} className="block text-sm font-semibold text-ink/50">
              ← All roles
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
