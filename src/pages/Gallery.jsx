import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, X, LayoutGrid, House, Building2, MapPinned, Store, Heart, ChevronDown, AlertTriangle,
} from "lucide-react";
import { listPublicProperties } from "../lib/api";
import { optimizedImageUrl } from "../lib/cloudinary";
import useFavorites from "../lib/useFavorites";
import Reveal from "../components/Reveal";
import RotatingWords from "../components/home/RotatingWords";
import Ticker from "../components/home/Ticker";
import ShowcaseHeader, { headerBtnCls } from "../components/gallery/ShowcaseHeader";
import FeaturedCarousel from "../components/gallery/FeaturedCarousel";
import PropertyTile from "../components/gallery/PropertyTile";
import CountUp from "../components/gallery/CountUp";

function parseImageList(p) {
  let urls = [];
  if (p.images) {
    try {
      const parsed = JSON.parse(p.images);
      if (Array.isArray(parsed) && parsed.length) urls = parsed.filter(Boolean);
    } catch {
      // fall through to the single imageUrl below
    }
  }
  if (urls.length === 0 && p.imageUrl) urls = [p.imageUrl];
  return urls;
}

const isSold = (p) => p.soldOut === "true" || p.soldOut === true;

// Pulls the first meaningful number out of a free-text price like
// "₹50,00,000" or "₹75 Lakhs–₹1 Crore", for sorting only.
function priceValue(price) {
  if (!price) return null;
  const cleaned = String(price).toLowerCase();
  const num = parseFloat(cleaned.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return null;
  if (cleaned.includes("crore")) return num * 10000000;
  if (cleaned.includes("lakh")) return num * 100000;
  return num;
}

// Short, friendly chip labels for the property types the forms use.
const SHORT_TYPE = {
  "Home / Independent House": "Independent House",
  "Apartment / Flat": "Apartment",
  "Plot / Land": "Plot",
  "Land / Plot": "Plot",
  "Shop / Retail": "Shop",
  "Office / Commercial Space": "Office",
};
const shortType = (t) => SHORT_TYPE[t] || t;

function typeIcon(t) {
  const x = t.toLowerCase();
  if (/apartment|flat/.test(x)) return Building2;
  if (/plot|land/.test(x)) return MapPinned;
  if (/shop|retail|office|commercial|hotel|restaurant|saloon/.test(x)) return Store;
  return House;
}

const SORT_OPTIONS = [
  { key: "newest", label: "Newest first" },
  { key: "price-low", label: "Price: low to high" },
  { key: "price-high", label: "Price: high to low" },
];

const CACHE_KEY = "mcm_gallery_cache_v2";
const SCROLL_KEY = "mcm_gallery_scroll";
const ROLLING = ["homes", "flats", "villas", "plots", "shops"];

function Chip({ active, onClick, icon: Icon, children, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-active={active}
      className={`chip shrink-0 h-12 pl-3.5 pr-4 rounded-2xl flex items-center gap-2 text-[14px] font-semibold transition-colors active:scale-95 ${
        active ? "bg-ink text-white" : "bg-[#EDE8E0] text-ink/80 hover:bg-[#E4DED4]"
      }`}
    >
      <Icon size={20} strokeWidth={1.8} className="chip-ico shrink-0" fill={active && Icon === Heart ? "currentColor" : "none"} />
      <span className="whitespace-nowrap">{children}</span>
      {count != null && <span className={`text-[12px] font-bold ${active ? "text-white/70" : "text-ink/45"}`}>{count}</span>}
    </button>
  );
}

function TileSkeleton() {
  return <div className="rounded-2xl aspect-[4/3] skeleton" />;
}

export default function Gallery() {
  const navigate = useNavigate();
  const favorites = useFavorites();
  const [properties, setProperties] = useState(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeType, setActiveType] = useState("All"); // "All" | a property type | "Saved"
  const [sort, setSort] = useState("newest");
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef(null);
  const restored = useRef(false);

  useEffect(() => {
    listPublicProperties()
      .then((data) => {
        const list = [...data].reverse();
        setProperties(list);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(list));
        } catch {
          // storage full or unavailable — not worth failing over
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  // Come back from a listing to the same place in the list.
  useEffect(() => {
    return () => {
      try {
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      } catch {
        // ignore
      }
    };
  }, []);
  useEffect(() => {
    if (!properties || restored.current) return;
    restored.current = true;
    try {
      const y = Number(sessionStorage.getItem(SCROLL_KEY));
      sessionStorage.removeItem(SCROLL_KEY);
      if (y > 0) requestAnimationFrame(() => window.scrollTo(0, y));
    } catch {
      // ignore
    }
  }, [properties]);

  // The chip bar gets a soft shadow once it is stuck to the top.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), { threshold: 0 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const types = useMemo(() => {
    if (!properties) return [];
    const counts = {};
    properties.forEach((p) => {
      if (p.type) counts[p.type] = (counts[p.type] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([type, n]) => ({ type, n }));
  }, [properties]);

  const savedCount = useMemo(
    () => (properties ? properties.filter((p) => favorites.has(p.id)).length : 0),
    [properties, favorites]
  );

  const visible = useMemo(() => {
    if (!properties) return [];
    const q = query.trim().toLowerCase();
    let list = properties.filter((p) => {
      const matchesQuery =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.type?.toLowerCase().includes(q);
      const matchesType =
        activeType === "All" ? true : activeType === "Saved" ? favorites.has(p.id) : p.type === activeType;
      return matchesQuery && matchesType;
    });
    if (sort === "price-low" || sort === "price-high") {
      list = [...list].sort((a, b) => {
        const av = priceValue(a.price);
        const bv = priceValue(b.price);
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return sort === "price-low" ? av - bv : bv - av;
      });
    }
    return list.map((p) => ({ ...p, _images: parseImageList(p) }));
  }, [properties, query, activeType, sort, favorites]);

  const featured = useMemo(
    () =>
      visible
        .filter((p) => !isSold(p) && p._images.length > 0)
        .slice(0, 4)
        .map((p) => ({
          id: p.id,
          title: p.title,
          location: p.location,
          price: p.price,
          image: optimizedImageUrl(p._images[0], 1200),
        })),
    [visible]
  );

  const areas = useMemo(() => {
    if (!properties) return [];
    return [...new Set(properties.map((p) => (p.location || "").split(",")[0].trim()).filter(Boolean))].slice(0, 12);
  }, [properties]);

  function clearFilters() {
    setQuery("");
    setActiveType("All");
  }

  function goBack() {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  }

  const loading = properties === null && !error;
  const hasAny = properties !== null && properties.length > 0;

  return (
    <div className="min-h-screen bg-canvas">
      <ShowcaseHeader
        left={
          <button type="button" onClick={goBack} aria-label="Go back" className={headerBtnCls}>
            <ArrowLeft size={22} />
          </button>
        }
        right={
          <button
            type="button"
            onClick={() => setSearchOpen((o) => !o)}
            aria-label={searchOpen ? "Close search" : "Search listings"}
            aria-expanded={searchOpen}
            className={headerBtnCls}
          >
            {searchOpen ? <X size={21} /> : <Search size={21} />}
            {!searchOpen && query.trim() && <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#E6C173]" />}
          </button>
        }
      />

      {/* Search slides open under the header */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${searchOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 pt-4">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                autoFocus={searchOpen}
                tabIndex={searchOpen ? 0 : -1}
                className="w-full h-12 rounded-2xl border border-ink/10 bg-surface pl-11 pr-11 text-[15px] text-ink placeholder:text-ink/40 outline-none focus:border-[#98691F] focus:shadow-[0_0_0_3px_rgba(152,105,31,0.18)] transition"
                placeholder="Search by title, area or type"
                aria-label="Search listings"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full hover:bg-ink/5 flex items-center justify-center"
                >
                  <X size={16} className="text-ink/50" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Title + rolling subtitle */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <h1 className="font-display font-bold text-ink text-[2.1rem] sm:text-5xl leading-[1.08] tracking-tight" aria-label="Property Gallery">
          <span aria-hidden="true">
            <span className="mask-word"><span className="mask-inner" style={{ "--d": "100ms" }}>Property</span></span>{" "}
            <span className="mask-word"><span className="mask-inner" style={{ "--d": "220ms" }}>Gallery</span></span>
          </span>
        </h1>
        <p className="fade-up mt-2 text-[15.5px] sm:text-lg text-ink/60 leading-relaxed" style={{ "--d": "450ms" }}>
          Explore handpicked <RotatingWords words={ROLLING} className="font-bold text-[#98691F]" /> from our trusted sellers.
        </p>
      </div>

      <div ref={sentinelRef} className="h-px" aria-hidden="true" />

      {/* Category chips (stick to the top while you scroll) */}
      <div className={`sticky top-0 z-30 bg-canvas transition-shadow duration-300 ${stuck ? "shadow-[0_10px_18px_-14px_rgba(27,42,74,0.45)]" : ""}`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2.5 overflow-x-auto no-scrollbar" role="group" aria-label="Filter by property type">
          <Chip active={activeType === "All"} onClick={() => setActiveType("All")} icon={LayoutGrid}>All</Chip>
          {types.map(({ type, n }) => (
            <Chip key={type} active={activeType === type} onClick={() => setActiveType(type)} icon={typeIcon(type)} count={n}>
              {shortType(type)}
            </Chip>
          ))}
          {(savedCount > 0 || activeType === "Saved") && (
            <Chip active={activeType === "Saved"} onClick={() => setActiveType("Saved")} icon={Heart} count={savedCount}>
              Saved
            </Chip>
          )}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 pb-10">
        {error && (
          <p className="alert-error max-w-md mx-auto mt-6">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            {error}
          </p>
        )}

        {loading && (
          <>
            <div className="mt-3 rounded-3xl aspect-[16/11] sm:aspect-[21/9] skeleton" />
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => <TileSkeleton key={i} />)}
            </div>
          </>
        )}

        {hasAny && featured.length > 0 && (
          <div className="mt-3">
            <FeaturedCarousel items={featured} />
          </div>
        )}

        {hasAny && areas.length > 1 && (
          <div className="mt-6" aria-label="Areas with listings">
            <Ticker words={areas} light />
          </div>
        )}

        {properties !== null && !hasAny && !error && (
          <div className="mt-10 rounded-3xl bg-surface border border-dashed border-ink/20 p-10 text-center">
            <p className="font-display font-bold text-xl text-ink">No listings published yet</p>
            <p className="text-sm text-ink/55 mt-1.5">New properties appear here as soon as they are shared. Check back soon.</p>
          </div>
        )}

        {hasAny && (
          <>
            <div className="mt-7 flex items-end justify-between gap-3">
              <h2 className="font-display font-bold text-ink text-[1.6rem] sm:text-3xl leading-tight">
                {activeType === "Saved" ? "Saved listings" : "Recent listings"}
                <span className="ml-2 align-middle text-[13px] font-bold text-white bg-ink rounded-full px-2.5 py-0.5">
                  <CountUp value={visible.length} />
                </span>
              </h2>
              <label className="relative flex items-center text-[#98691F] font-semibold text-[15px] cursor-pointer">
                <span className="sr-only">Sort listings</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none bg-transparent pr-6 text-right cursor-pointer outline-none focus-visible:underline"
                >
                  {SORT_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-0 pointer-events-none" />
              </label>
            </div>

            {visible.length === 0 ? (
              <div className="mt-6 rounded-3xl bg-surface border border-dashed border-ink/20 p-10 text-center">
                <p className="font-display font-bold text-lg text-ink">
                  {activeType === "Saved" ? "Nothing saved yet" : "No listings match"}
                </p>
                <p className="text-sm text-ink/55 mt-1.5">
                  {activeType === "Saved" ? "Tap the heart on any property to keep it here." : "Try a different search or clear the filters."}
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 h-11 px-6 rounded-full border border-ink/20 text-ink text-[12px] font-bold uppercase tracking-[0.12em] hover:bg-ink/5 transition-colors"
                >
                  {activeType === "Saved" ? "Browse all listings" : "Clear filters"}
                </button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {visible.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 2) * 90} distance={22}>
                    <PropertyTile
                      p={{ id: p.id, title: p.title, location: p.location, price: p.price, soldOut: isSold(p), images: p._images.map((u) => optimizedImageUrl(u, 600)) }}
                      saved={favorites.has(p.id)}
                      onToggleSaved={favorites.toggle}
                    />
                  </Reveal>
                ))}
              </div>
            )}
          </>
        )}

        {/* Register prompt: sits at the end of the list, where interest is highest */}
        {hasAny && (
          <div className="mt-12 rounded-3xl bg-ink text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_18px_36px_-18px_rgba(10,17,36,0.7)]">
            <div>
              <p className="font-display font-bold text-xl">Have a property to sell, or looking to buy?</p>
              <p className="text-sm text-white/65 mt-1">Get listed with Middle Class Mediator. It takes a minute.</p>
            </div>
            <Link
              to="/"
              className="shrink-0 h-12 px-7 rounded-full bg-coral text-white text-[12px] font-bold uppercase tracking-[0.12em] flex items-center justify-center hover:brightness-110 transition"
            >
              Register now
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
