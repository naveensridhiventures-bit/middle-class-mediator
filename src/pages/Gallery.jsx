import { useEffect, useMemo, useState } from "react";
import {
  Handshake, MapPin, Ruler, Download,
  Search, SlidersHorizontal, ArrowUpDown, X,
} from "lucide-react";
import { listPublicProperties } from "../lib/api";
import { whatsappLink } from "../lib/whatsapp";
import { ADMIN_WHATSAPP_NUMBER } from "../lib/config";
import { optimizedImageUrl } from "../lib/cloudinary";
import Carousel from "../components/Carousel";
import SoldOutStamp from "../components/SoldOutStamp";
import { downloadBrochure } from "../lib/report";

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

function PropertyCard({ p, index }) {
  const images = parseImages(p);
  const attributes = parseAttributes(p);
  const attrEntries = Object.entries(attributes).filter(([, v]) => v);
  const [downloading, setDownloading] = useState(false);
  const soldOut = p.soldOut === "true" || p.soldOut === true;

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadBrochure(p);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      className={`group rounded-3xl overflow-hidden bg-white shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 animate-[fadeInUp_0.6s_ease_both] ${soldOut ? "opacity-90" : ""}`}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="aspect-[4/3] relative">
        <div className={soldOut ? "grayscale opacity-70 w-full h-full" : "w-full h-full"}>
          <Carousel images={images} alt={p.title} showCounter />
        </div>
        {p.price && !soldOut && (
          <span className="absolute top-3 left-3 z-10 bg-white/95 text-ink font-display font-bold text-sm px-3 py-1 rounded-full shadow">
            {p.price}
          </span>
        )}
        {soldOut && <SoldOutStamp size="lg" />}
      </div>
      <div className="p-5 space-y-2">
        {p.type && (
          <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-seller/10 text-seller">
            {p.type}
          </span>
        )}
        <h3 className="font-display font-semibold text-lg text-ink leading-snug">{p.title}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {p.location && (
            <p className="text-xs text-ink/50 flex items-center gap-1">
              <MapPin size={12} className="shrink-0" />
              {p.location}
            </p>
          )}
          {p.sqft && (
            <p className="text-xs text-ink/50 flex items-center gap-1">
              <Ruler size={12} className="shrink-0" />
              {Number(p.sqft).toLocaleString()} sqft
            </p>
          )}
          {soldOut && p.price && <p className="text-xs text-ink/40 line-through">{p.price}</p>}
        </div>
        {p.description && <p className="text-xs text-ink/50">{p.description}</p>}

        {attrEntries.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {attrEntries.map(([k, v]) => (
              <div key={k} className="bg-ink/[0.035] rounded-lg px-2.5 py-1.5">
                <p className="text-[9px] uppercase tracking-wide text-ink/35 font-bold leading-none mb-0.5">{k}</p>
                <p className="text-xs text-ink/70 font-medium truncate">{v}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {soldOut ? (
            <span className="flex-1 !py-2.5 text-sm text-center rounded-xl bg-ink/10 text-ink/40 font-semibold flex items-center justify-center">
              No longer available
            </span>
          ) : (
            <a
              href={whatsappLink(
                ADMIN_WHATSAPP_NUMBER,
                `Hi, I'm interested in this property: ${p.title}${p.location ? ` (${p.location})` : ""} — ${p.price || ""}${p.refId ? `\n\nProperty ref: ${p.refId}` : ""}\n\nCan you share more details?`
              )}
              target="_blank"
              rel="noreferrer"
              className="btn-whatsapp flex-1 !py-2.5 text-sm text-center group-hover:scale-[1.02] transition-transform"
            >
              Show interest on WhatsApp
            </a>
          )}
          <button
            onClick={handleDownload}
            disabled={downloading}
            title="Download brochure"
            className="btn-ghost !px-3.5 flex items-center justify-center shrink-0"
          >
            <Download size={16} className={downloading ? "animate-pulse" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Main gallery ----------

const SORT_OPTIONS = [
  { key: "newest", label: "Newest first" },
  { key: "price-low", label: "Price: Low to High" },
  { key: "price-high", label: "Price: High to Low" },
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
  const [showFilters, setShowFilters] = useState(false);

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
    <div className="min-h-screen bg-paper">
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Header */}
      <div className="bg-ink text-paper relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="max-w-6xl mx-auto px-5 py-10 sm:py-14 text-center relative">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="w-14 h-14 rounded-full border-2 border-gold flex items-center justify-center">
              <span className="font-display font-bold text-gold text-sm tracking-wide">MCM</span>
            </div>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gold flex items-center justify-center">
              <Handshake size={11} className="text-ink" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="font-display font-bold text-gold text-3xl sm:text-4xl tracking-tight">Property Gallery</h1>
          <p className="text-paper/70 text-sm mt-2 max-w-md mx-auto">
            Curated listings from our sellers. Like something? Show interest on WhatsApp and our
            team will reach out with the full details.
          </p>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-0 z-20 bg-paper/95 backdrop-blur-sm border-b border-ink/5 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 py-3 flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
            <input
              className="field-input !pl-9 !py-2.5 text-sm w-full"
              placeholder="Search by title, area, or type…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="field-input !py-2.5 !pl-8 text-sm appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <ArrowUpDown size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none" />
          </div>

          {types.length > 0 && (
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition ${
                showFilters || activeType !== "All" ? "bg-ink text-paper border-ink" : "bg-white/60 text-ink/60 border-ink/10"
              }`}
            >
              <SlidersHorizontal size={14} />
              Type {activeType !== "All" && <span className="opacity-70">· {activeType}</span>}
            </button>
          )}
        </div>

        {showFilters && types.length > 0 && (
          <div className="max-w-6xl mx-auto px-5 pb-3 flex flex-wrap gap-1.5">
            {["All", ...types].map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  activeType === t ? "bg-ink text-paper border-ink" : "bg-white/60 text-ink/60 border-ink/10 hover:border-ink/30"
                }`}
              >
                {t}
              </button>
            ))}
            {activeType !== "All" && (
              <button onClick={() => setActiveType("All")} className="px-3 py-1.5 rounded-full text-xs font-semibold text-buyer flex items-center gap-1">
                <X size={12} /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-5 py-10">
        {error && <p className="text-buyer text-sm text-center">{error}</p>}
        {properties === null && !error && <p className="text-ink/50 text-sm text-center">Loading…</p>}
        {properties !== null && properties.length === 0 && (
          <p className="text-ink/50 text-sm text-center">No listings published yet — check back soon.</p>
        )}
        {properties !== null && properties.length > 0 && (
          <p className="text-xs text-ink/40 font-semibold mb-4">
            {filtered.length} listing{filtered.length === 1 ? "" : "s"}
          </p>
        )}
        {properties !== null && properties.length > 0 && filtered.length === 0 && (
          <p className="text-ink/50 text-sm text-center py-10">No listings match your search — try clearing a filter.</p>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p, i) => <PropertyCard key={p.id} p={p} index={i} />)}
        </div>
      </div>
    </div>
  );
}
