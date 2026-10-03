import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Ruler, Quote, Search, ArrowUpDown, AlertTriangle, ChevronRight } from "lucide-react";
import { listPublicProperties } from "../lib/api";
import { whatsappLink } from "../lib/whatsapp";
import { ADMIN_WHATSAPP_NUMBER } from "../lib/config";
import { optimizedImageUrl } from "../lib/cloudinary";
import { COLORS } from "../lib/theme";
import Carousel from "../components/Carousel";
import SoldOutStamp from "../components/SoldOutStamp";
import ImageLightbox from "../components/ImageLightbox";
import BrandHeader from "../components/wizard/BrandHeader";

function parseAttributes(p) {
  if (!p.attributes) return {};
  try {
    const parsed = JSON.parse(p.attributes);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function parseImages(p) {
  let urls = [];
  if (p.images) {
    try {
      const parsed = JSON.parse(p.images);
      if (Array.isArray(parsed) && parsed.length) urls = parsed.filter(Boolean);
    } catch {
      // fall through to single imageUrl below
    }
  }
  if (urls.length === 0 && p.imageUrl) urls = [p.imageUrl];
  // Request a resized, optimized version — full-resolution camera photos
  // are what actually made the gallery slow to load, not the API call.
  return urls.map((u) => optimizedImageUrl(u, 700));
}

// Pulls the first meaningful number out of a free-text price string like
// "₹50,00,000" or "₹75 Lakhs–₹1 Crore", for sorting purposes only.
function priceValue(price) {
  if (!price) return null;
  const cleaned = String(price).toLowerCase();
  const num = parseFloat(cleaned.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return null;
  if (cleaned.includes("crore")) return num * 10000000;
  if (cleaned.includes("lakh")) return num * 100000;
  return num;
}

// ---------- Property card ----------

function PropertyCard({ p }) {
  const images = parseImages(p);
  const attributes = parseAttributes(p);
  const attrEntries = Object.entries(attributes).filter(([, v]) => v);
  const soldOut = p.soldOut === "true" || p.soldOut === true;
  const [lightboxIndex, setLightboxIndex] = useState(null);

  return (
    <article className="bg-surface rounded-2xl border border-ink/10 overflow-hidden flex flex-col transition-shadow hover:shadow-lg">
      <div className="aspect-[4/3] relative">
        <div className={soldOut ? "grayscale opacity-70 w-full h-full" : "w-full h-full"}>
          <Carousel images={images} alt={p.title} showCounter onImageClick={images.length ? setLightboxIndex : undefined} />
        </div>
        {p.price && !soldOut && (
          <span className="absolute top-3 left-3 z-10 bg-ink text-white font-display font-bold text-sm px-3 py-1.5 rounded-full shadow">
            {p.price}
          </span>
        )}
        {soldOut && <SoldOutStamp size="lg" />}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="space-y-2">
          {p.type && (
            <span
              className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ color: COLORS.teal, backgroundColor: `color-mix(in srgb, ${COLORS.teal} 10%, white)` }}
            >
              {p.type}
            </span>
          )}
          <Link to={`/gallery/${p.id}`} className="block">
            <h3 className="font-display font-bold text-lg text-ink leading-snug hover:underline underline-offset-4">{p.title}</h3>
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {p.location && (
              <p className="text-xs text-ink/55 flex items-center gap-1">
                <MapPin size={12} className="shrink-0" />
                {p.location}
              </p>
            )}
            {p.sqft && (
              <p className="text-xs text-ink/55 flex items-center gap-1">
                <Ruler size={12} className="shrink-0" />
                {Number(p.sqft).toLocaleString()} sqft
              </p>
            )}
            {soldOut && p.price && <p className="text-xs text-ink/40 line-through">{p.price}</p>}
          </div>
          {p.description && <p className="text-[13px] text-ink/60 leading-relaxed">{p.description}</p>}
        </div>

        {attrEntries.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {attrEntries.map(([k, v]) => (
              <div key={k} className="bg-[#F7F5F1] rounded-lg px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-ink/50 font-bold leading-none mb-1">{k}</p>
                <p className="text-[13px] text-ink/80 font-medium truncate">{v}</p>
              </div>
            ))}
          </div>
        )}

        {p.sellerNote && (
          <div className="relative bg-[#F8F2E4] border-l-4 border-gold rounded-r-xl pl-4 pr-4 py-3">
            <Quote size={16} className="text-gold/60 absolute top-2.5 right-3" />
            <p className="text-[10px] uppercase tracking-wider text-gold-dark font-bold mb-1">Seller's remark</p>
            <p className="text-sm text-ink/75 italic leading-relaxed pr-5 whitespace-pre-line">{p.sellerNote}</p>
          </div>
        )}

        <div className="mt-auto pt-1 flex gap-2.5">
          {soldOut ? (
            <span className="flex-1 h-12 rounded-full bg-ink/10 text-ink/45 text-[12px] font-bold uppercase tracking-[0.12em] flex items-center justify-center">
              No longer available
            </span>
          ) : (
            <>
              <Link
                to={`/gallery/${p.id}`}
                className="h-12 px-5 rounded-full border border-ink/20 text-ink text-[12px] font-bold uppercase tracking-[0.12em] flex items-center justify-center gap-1 hover:bg-ink/5 transition-colors"
              >
                Details
                <ChevronRight size={14} />
              </Link>
              <a
                href={whatsappLink(
                  ADMIN_WHATSAPP_NUMBER,
                  `Hi, I'm interested in this property: ${p.title}${p.location ? ` (${p.location})` : ""} — ${p.price || ""}${p.refId ? `\n\nProperty ref: ${p.refId}` : ""}\n\nCan you share more details?`
                )}
                target="_blank"
                rel="noreferrer"
                className="flex-1 h-12 rounded-full bg-whatsapp text-white text-[12px] font-bold uppercase tracking-[0.12em] flex items-center justify-center text-center px-3"
              >
                I'm interested
              </a>
            </>
          )}
        </div>
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox images={images} initialIndex={lightboxIndex} alt={p.title} onClose={() => setLightboxIndex(null)} />
      )}
    </article>
  );
}

// ---------- Loading skeleton ----------

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-surface border border-ink/10">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-20 rounded-full skeleton" />
        <div className="h-5 w-3/4 rounded-md skeleton" />
        <div className="h-3 w-1/2 rounded-md skeleton" />
        <div className="h-12 w-full rounded-full skeleton mt-2" />
      </div>
    </div>
  );
}

// ---------- Main gallery ----------

const SORT_OPTIONS = [
  { key: "newest", label: "Newest first" },
  { key: "price-low", label: "Price: low to high" },
  { key: "price-high", label: "Price: high to low" },
];

const CACHE_KEY = "mcm_gallery_cache_v1";

export default function Gallery() {
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
  const [activeType, setActiveType] = useState("All");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    listPublicProperties()
      .then((data) => {
        const list = [...data].reverse();
        setProperties(list);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(list));
        } catch {
          // sessionStorage full/unavailable — not worth failing over
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  const types = useMemo(() => {
    if (!properties) return [];
    return [...new Set(properties.map((p) => p.type).filter(Boolean))].sort();
  }, [properties]);

  const filtered = useMemo(() => {
    if (!properties) return [];
    const q = query.trim().toLowerCase();
    let list = properties.filter((p) => {
      const matchesQuery =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.type?.toLowerCase().includes(q);
      const matchesType = activeType === "All" || p.type === activeType;
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
    return list;
  }, [properties, query, activeType, sort]);

  return (
    <div className="min-h-screen bg-canvas">
      <BrandHeader
        color={COLORS.teal}
        wide
        right={
          <Link
            to="/"
            className="rounded-full bg-coral text-white text-[11px] font-bold uppercase tracking-[0.12em] px-4 py-2.5 hover:brightness-110 transition"
          >
            Register
          </Link>
        }
      />

      <div className="max-w-6xl mx-auto px-5 pt-7">
        <h1 className="font-display font-bold text-[1.8rem] sm:text-4xl leading-tight text-ink">Property gallery</h1>
        <p className="text-sm text-ink/60 mt-2 max-w-xl leading-relaxed">
          Listings shared by our sellers. Tap "I'm interested" and our team will send you the full details on WhatsApp.
        </p>
      </div>

      {/* Sticky search + filters */}
      <div className="sticky top-0 z-20 bg-canvas border-b border-ink/5 mt-5">
        <div className="max-w-6xl mx-auto px-5 pt-3 flex items-center gap-2.5">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
            <input
              className="w-full rounded-xl border border-ink/10 bg-surface pl-10 pr-4 py-3 text-sm text-ink placeholder:text-ink/40 outline-none focus:border-teal focus:shadow-[0_0_0_3px_rgba(31,111,92,0.15)] transition"
              placeholder="Search listings"
              aria-label="Search listings"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="relative shrink-0">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort listings"
              className="rounded-xl border border-ink/10 bg-surface pl-9 pr-3 py-3 text-sm text-ink appearance-none cursor-pointer outline-none focus:border-teal max-w-[11.5rem]"
            >
              {SORT_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
          </div>
        </div>

        {types.length > 0 && (
          <div className="max-w-6xl mx-auto px-5 py-3 flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Filter by property type">
            {["All", ...types].map((t) => {
              const on = activeType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveType(t)}
                  aria-pressed={on}
                  className={`shrink-0 h-9 px-4 rounded-full text-[13px] font-semibold border transition-colors ${
                    on ? "bg-ink text-white border-ink" : "bg-surface text-ink/70 border-ink/15 hover:border-ink/40"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-5 py-6">
        {error && (
          <p className="alert-error max-w-md mx-auto mb-6">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            {error}
          </p>
        )}
        {properties !== null && properties.length === 0 && !error && (
          <p className="text-ink/55 text-sm text-center py-10">No listings published yet. Check back soon.</p>
        )}
        {properties !== null && properties.length > 0 && (
          <p className="text-xs text-ink/50 font-semibold mb-4">
            {filtered.length} listing{filtered.length === 1 ? "" : "s"}
          </p>
        )}
        {properties !== null && properties.length > 0 && filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-ink/60 text-sm">No listings match your search.</p>
            <button
              type="button"
              onClick={() => { setQuery(""); setActiveType("All"); }}
              className="mt-3 h-11 px-6 rounded-full border border-ink/20 text-ink text-[12px] font-bold uppercase tracking-[0.12em] hover:bg-ink/5 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}

        {properties === null && !error ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        )}

        {/* Register prompt — sits at the end of the list, where interest is highest */}
        <div className="mt-10 rounded-2xl bg-ink text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-display font-bold text-lg">Have a property to sell, or looking to buy?</p>
            <p className="text-sm text-white/65 mt-1">Get listed with Middle Class Mediator. It takes a minute.</p>
          </div>
          <Link
            to="/"
            className="shrink-0 h-12 px-7 rounded-full bg-coral text-white text-[12px] font-bold uppercase tracking-[0.12em] flex items-center justify-center hover:brightness-110 transition"
          >
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
}
