import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, X, LayoutGrid, Heart, ChevronDown, SlidersHorizontal, AlertTriangle } from "lucide-react";
import { optimizedImageUrl } from "../lib/cloudinary";
import useFavorites from "../lib/useFavorites";
import useProperties from "../lib/useProperties";
import { DEFAULT_FILTERS, activeFilterCount, applyFilters, shortType, sortListings } from "../lib/gallery";
import Reveal from "../components/Reveal";
import RotatingWords from "../components/home/RotatingWords";
import Ticker from "../components/home/Ticker";
import ShowcaseHeader, { headerBtnCls } from "../components/gallery/ShowcaseHeader";
import FeaturedCarousel from "../components/gallery/FeaturedCarousel";
import PropertyTile from "../components/gallery/PropertyTile";
import FilterSheet from "../components/gallery/FilterSheet";
import CountUp from "../components/gallery/CountUp";
import { iconForType } from "../components/gallery/typeIcons";

const SORT_OPTIONS = [
  { key: "newest", label: "Newest first" },
  { key: "price-low", label: "Price: low to high" },
  { key: "price-high", label: "Price: high to low" },
];
const SCROLL_KEY = "mcm_gallery_scroll";
const ROLLING = ["homes", "flats", "villas", "plots", "shops"];

function Chip({ active, onClick, icon: Icon, children, count, delay = 0 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-active={active}
      style={{ "--d": `${delay}ms` }}
      className={`chip enter-up shrink-0 h-12 pl-3.5 pr-4 rounded-2xl flex items-center gap-2 text-[14px] font-semibold transition-colors active:scale-95 ${
        active ? "bg-ink text-white" : "bg-[#EDE8E0] text-ink/80 hover:bg-[#E4DED4]"
      }`}
    >
      <Icon size={20} strokeWidth={1.8} className="chip-ico shrink-0" fill={active && Icon === Heart ? "currentColor" : "none"} />
      <span className={typeof children === "string" && children.length > 12 && children.includes(" ") ? "text-[13px] leading-[1.15] max-w-[5.4rem]" : "whitespace-nowrap"}>{children}</span>
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
  const { properties, error } = useProperties();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef(null);
  const restored = useRef(false);
  const lastY = useRef(0);

  // Come back from a listing to the same place in the list. The position is
  // tracked while you scroll, because by the time this page unmounts the
  // browser has already shortened it and reset scrollY.
  useEffect(() => {
    const onScroll = () => {
      lastY.current = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      try {
        sessionStorage.setItem(SCROLL_KEY, String(lastY.current));
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

  const areas = useMemo(() => {
    if (!properties) return [];
    return [...new Set(properties.map((p) => p.area).filter(Boolean))].sort();
  }, [properties]);

  const savedCount = useMemo(
    () => (properties ? properties.filter((p) => favorites.has(p.id)).length : 0),
    [properties, favorites]
  );

  const visible = useMemo(() => {
    if (!properties) return [];
    return sortListings(applyFilters(properties, filters, query, savedOnly, favorites.has), sort);
  }, [properties, filters, query, savedOnly, sort, favorites]);

  const featured = useMemo(
    () =>
      visible
        .filter((l) => !l.sold && l.images.length > 0)
        .slice(0, 4)
        .map((l) => ({
          id: l.id,
          title: l.title,
          location: l.location,
          price: l.price,
          image: optimizedImageUrl(l.images[0], 1200),
        })),
    [visible]
  );

  const filterCount = activeFilterCount(filters);

  function pickType(type) {
    setSavedOnly(false);
    setFilters((f) => ({ ...f, type }));
  }
  function resetAll() {
    setQuery("");
    setFilters(DEFAULT_FILTERS);
    setSavedOnly(false);
  }
  function goBack() {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  }

  const loading = properties === null && !error;
  const hasAny = properties !== null && properties.length > 0;
  const allActive = filters.type === "All" && !savedOnly;

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
            {!searchOpen && (query.trim() || filterCount > 0) && <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#E6C173]" />}
          </button>
        }
      />

      {/* Search (with the price / size / facing filters) slides open under the header */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${searchOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 pt-4 flex gap-2.5">
            <div className="relative flex-1 min-w-0">
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
            <button
              type="button"
              tabIndex={searchOpen ? 0 : -1}
              onClick={() => setShowFilters(true)}
              aria-label={filterCount ? `Filters, ${filterCount} active` : "Filters"}
              className="relative shrink-0 w-12 h-12 rounded-2xl bg-ink-dark text-white flex items-center justify-center active:scale-95 transition-transform"
            >
              <SlidersHorizontal size={20} />
              {filterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[1.2rem] h-[1.2rem] px-1 rounded-full bg-[#C99A4A] text-ink-dark text-[11px] font-bold flex items-center justify-center">
                  {filterCount}
                </span>
              )}
            </button>
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
          <Chip active={allActive} onClick={() => pickType("All")} icon={LayoutGrid} delay={500}>All</Chip>
          {types.map(({ type, n }, i) => (
            <Chip
              key={type}
              active={!savedOnly && filters.type === type}
              onClick={() => pickType(type)}
              icon={iconForType(type)}
              count={n}
              delay={560 + i * 60}
            >
              {shortType(type)}
            </Chip>
          ))}
          {(savedCount > 0 || savedOnly) && (
            <Chip
              active={savedOnly}
              onClick={() => {
                setSavedOnly(true);
                setFilters((f) => ({ ...f, type: "All" }));
              }}
              icon={Heart}
              count={savedCount}
            >
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

        {hasAny && filterCount > 0 && (
          <p className="mt-1 mb-2 text-[13px] text-ink/60">
            {filterCount} filter{filterCount === 1 ? "" : "s"} on.{" "}
            <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)} className="font-bold text-[#8A6218] underline underline-offset-2">
              Clear filters
            </button>
          </p>
        )}

        {hasAny && featured.length > 0 && (
          <div className="enter-up mt-3" style={{ "--d": "750ms" }}>
            <FeaturedCarousel items={featured} />
          </div>
        )}

        {hasAny && areas.length > 1 && (
          <div className="mt-6" aria-label="Areas with listings">
            <Ticker words={areas.slice(0, 12)} light />
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
                {savedOnly ? "Saved listings" : "Recent listings"}
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
                <p className="font-display font-bold text-lg text-ink">{savedOnly ? "Nothing saved yet" : "No listings match"}</p>
                <p className="text-sm text-ink/55 mt-1.5">
                  {savedOnly ? "Tap the heart on any property to keep it here." : "Try a different search or clear the filters."}
                </p>
                <button
                  type="button"
                  onClick={resetAll}
                  className="mt-5 h-11 px-6 rounded-full border border-ink/20 text-ink text-[12px] font-bold uppercase tracking-[0.12em] hover:bg-ink/5 transition-colors"
                >
                  {savedOnly ? "Browse all listings" : "Clear filters"}
                </button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {visible.map((l, i) => (
                  <Reveal key={l.id} delay={(i % 2) * 90} distance={22}>
                    <PropertyTile
                      p={{ id: l.id, title: l.title, location: l.location, price: l.price, soldOut: l.sold, images: l.images.map((u) => optimizedImageUrl(u, 600)) }}
                      saved={favorites.has(l.id)}
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

      {showFilters && (
        <FilterSheet
          filters={filters}
          onChange={setFilters}
          types={types.map((t) => t.type)}
          areas={areas}
          resultCount={visible.length}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
}
