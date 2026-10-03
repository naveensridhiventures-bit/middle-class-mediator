import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, SlidersHorizontal, Heart, ChevronRight, ChevronDown, AlertTriangle } from "lucide-react";
import useProperties from "../lib/useProperties";
import useFavorites from "../lib/useFavorites";
import { DEFAULT_FILTERS, activeFilterCount, applyFilters, sortListings } from "../lib/gallery";
import Reveal from "../components/Reveal";
import RotatingWords from "../components/home/RotatingWords";
import TopBar, { roundBtn } from "../components/gallery/TopBar";
import CategoryStrip from "../components/gallery/CategoryStrip";
import { FeaturedCard, GridCard } from "../components/gallery/ListingCards";
import FilterSheet from "../components/gallery/FilterSheet";
import BottomNav from "../components/gallery/BottomNav";
import CountUp from "../components/gallery/CountUp";

const SCROLL_KEY = "mcm_gallery_scroll";
const SORT_OPTIONS = [
  { key: "newest", label: "Newest first" },
  { key: "price-low", label: "Price: low to high" },
  { key: "price-high", label: "Price: high to low" },
];
const SEARCH_WORDS = ["homes", "flats", "plots", "villas", "shops", "areas"];
const GOLD_TEXT = "#8A6218";

export default function Gallery() {
  const navigate = useNavigate();
  const favorites = useFavorites();
  const { properties, error } = useProperties();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState("newest");
  const [savedOnly, setSavedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const restored = useRef(false);

  // Come back from a listing to the same place in the list. The position is
  // tracked while you scroll, because by the time this page unmounts the
  // browser has already shortened it and reset scrollY.
  const lastY = useRef(0);
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

  const types = useMemo(() => {
    if (!properties) return [];
    const counts = {};
    properties.forEach((p) => {
      if (p.type) counts[p.type] = (counts[p.type] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([t]) => t);
  }, [properties]);

  const areas = useMemo(() => {
    if (!properties) return [];
    return [...new Set(properties.map((p) => p.area).filter(Boolean))].sort();
  }, [properties]);

  const savedCount = useMemo(() => (properties ? properties.filter((p) => favorites.has(p.id)).length : 0), [properties, favorites]);

  const visible = useMemo(() => {
    if (!properties) return [];
    return sortListings(applyFilters(properties, filters, query, savedOnly, favorites.has), sort);
  }, [properties, filters, query, savedOnly, sort, favorites]);

  const filterCount = activeFilterCount(filters);
  const browsing = !query.trim() && filterCount === 0 && !savedOnly;
  const featured = useMemo(() => (browsing ? visible.filter((l) => !l.sold && l.images.length > 0).slice(0, 3) : []), [browsing, visible]);

  function goBack() {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  }
  function resetAll() {
    setQuery("");
    setFilters(DEFAULT_FILTERS);
    setSavedOnly(false);
  }
  function toggleSaved() {
    setSavedOnly((s) => !s);
    requestAnimationFrame(() => document.getElementById("all-properties")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const loading = properties === null && !error;
  const hasAny = properties !== null && properties.length > 0;
  const showPlaceholder = !query && !focused;

  return (
    <div className="min-h-screen bg-canvas" style={{ paddingBottom: "calc(6.5rem + env(safe-area-inset-bottom))" }}>
      <TopBar
        title="Property Gallery"
        onBack={goBack}
        right={
          <button
            type="button"
            onClick={toggleSaved}
            aria-pressed={savedOnly}
            aria-label={savedOnly ? "Show all properties" : "Show saved properties"}
            className={`${roundBtn} ${savedOnly ? "bg-ink text-[#E6C173]" : "text-ink hover:bg-ink/5"}`}
          >
            <Heart size={21} fill={savedOnly ? "currentColor" : "none"} />
            {savedCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[#E5584A] text-white text-[10px] font-bold flex items-center justify-center">
                {savedCount}
              </span>
            )}
          </button>
        }
      />

      <div className="max-w-6xl mx-auto px-4">
        {/* Search + filters */}
        <div className="mt-2 flex gap-2.5">
          <div className="relative flex-1 min-w-0">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/45 pointer-events-none" />
            <input
              className="w-full h-12 rounded-2xl border border-ink/10 bg-surface pl-11 pr-10 text-[15px] text-ink outline-none transition focus:border-[#C99A4A] focus:shadow-[0_0_0_3px_rgba(201,154,74,0.22)]"
              aria-label="Search properties and locations"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              type="text"
              inputMode="search"
              enterKeyHint="search"
            />
            {/* The placeholder itself moves: "Search homes… flats… plots…" */}
            {showPlaceholder && (
              <span className="absolute left-11 top-1/2 -translate-y-1/2 text-[15px] text-ink/45 pointer-events-none whitespace-nowrap" aria-hidden="true">
                Search <RotatingWords words={SEARCH_WORDS} interval={2200} className="font-semibold text-ink/65" />, locations…
              </span>
            )}
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full hover:bg-ink/5 flex items-center justify-center">
                <X size={16} className="text-ink/50" />
              </button>
            )}
          </div>
          <button
            type="button"
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

        {/* Property-type tiles */}
        {hasAny && (
          <div className="mt-4">
            <CategoryStrip types={types} active={filters.type} onChange={(t) => setFilters((f) => ({ ...f, type: t }))} />
          </div>
        )}

        {error && (
          <p className="alert-error max-w-md mx-auto mt-6">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            {error}
          </p>
        )}

        {loading && (
          <>
            <div className="mt-5 h-6 w-48 rounded-md skeleton" />
            <div className="mt-3 rounded-3xl h-72 skeleton" />
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-2xl h-48 skeleton" />)}
            </div>
          </>
        )}

        {properties !== null && !hasAny && !error && (
          <div className="mt-8 rounded-3xl bg-surface border border-dashed border-ink/20 p-10 text-center">
            <p className="font-display font-bold text-xl text-ink">No properties published yet</p>
            <p className="text-sm text-ink/55 mt-1.5">New listings appear here as soon as they are shared. Check back soon.</p>
          </div>
        )}

        {/* Featured properties */}
        {featured.length > 0 && (
          <section className="mt-6" aria-labelledby="featured-title">
            <div className="flex items-center justify-between">
              <h2 id="featured-title" className="font-display font-bold text-[1.35rem] text-ink">Featured Properties</h2>
              <button
                type="button"
                onClick={() => document.getElementById("all-properties")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="flex items-center text-[14px] font-bold"
                style={{ color: GOLD_TEXT }}
              >
                View All <ChevronRight size={16} />
              </button>
            </div>
            <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((l, i) => (
                <Reveal key={l.id} delay={i * 110} distance={24} className="h-full">
                  <FeaturedCard listing={l} saved={favorites.has(l.id)} onToggleSaved={favorites.toggle} />
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* All properties */}
        {hasAny && (
          <section id="all-properties" className="mt-8 scroll-mt-4" aria-labelledby="all-title">
            <div className="flex items-end justify-between gap-3">
              <h2 id="all-title" className="font-display font-bold text-[1.35rem] text-ink">
                {savedOnly ? "Saved" : browsing ? "All Properties" : "Results"}
                <span className="ml-2 align-middle text-[12px] font-bold text-white bg-ink rounded-full px-2.5 py-0.5">
                  <CountUp value={visible.length} />
                </span>
              </h2>
              <label className="relative flex items-center font-semibold text-[14px] cursor-pointer" style={{ color: GOLD_TEXT }}>
                <span className="sr-only">Sort properties</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="appearance-none bg-transparent pr-5 text-right cursor-pointer outline-none focus-visible:underline">
                  {SORT_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <ChevronDown size={15} className="absolute right-0 pointer-events-none" />
              </label>
            </div>

            {visible.length === 0 ? (
              <div className="mt-4 rounded-3xl bg-surface border border-dashed border-ink/20 p-10 text-center">
                <p className="font-display font-bold text-lg text-ink">{savedOnly ? "Nothing saved yet" : "No properties match"}</p>
                <p className="text-sm text-ink/55 mt-1.5">
                  {savedOnly ? "Tap the heart on any property to keep it here." : "Try a different search or loosen the filters."}
                </p>
                <button
                  type="button"
                  onClick={resetAll}
                  className="mt-5 h-11 px-6 rounded-full border border-ink/20 text-ink text-[12px] font-bold uppercase tracking-[0.12em] hover:bg-ink/5 transition-colors"
                >
                  {savedOnly ? "Browse all properties" : "Reset filters"}
                </button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {visible.map((l, i) => (
                  <Reveal key={l.id} delay={(i % 2) * 90} distance={22} className="h-full">
                    <GridCard listing={l} saved={favorites.has(l.id)} onToggleSaved={favorites.toggle} />
                  </Reveal>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <BottomNav savedCount={savedCount} savedActive={savedOnly} onSaved={toggleSaved} />

      {showFilters && (
        <FilterSheet
          filters={filters}
          onChange={setFilters}
          types={types}
          areas={areas}
          resultCount={visible.length}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
}
