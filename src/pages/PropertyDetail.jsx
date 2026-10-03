import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Ruler, ArrowLeft, Quote, AlertTriangle, Heart, Share2, Check } from "lucide-react";
import { listPublicProperties } from "../lib/api";
import { whatsappLink } from "../lib/whatsapp";
import { ADMIN_WHATSAPP_NUMBER } from "../lib/config";
import { optimizedImageUrl } from "../lib/cloudinary";
import { COLORS } from "../lib/theme";
import useFavorites from "../lib/useFavorites";
import Carousel from "../components/Carousel";
import SoldOutStamp from "../components/SoldOutStamp";
import ImageLightbox from "../components/ImageLightbox";
import ShowcaseHeader, { headerBtnCls } from "../components/gallery/ShowcaseHeader";

function parseImages(p) {
  let urls = [];
  if (p.images) {
    try {
      const parsed = JSON.parse(p.images);
      if (Array.isArray(parsed) && parsed.length) urls = parsed.filter(Boolean);
    } catch {
      // fall through
    }
  }
  if (urls.length === 0 && p.imageUrl) urls = [p.imageUrl];
  return urls;
}

function parseAttributes(p) {
  if (!p.attributes) return {};
  try {
    const parsed = JSON.parse(p.attributes);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

const backButton = (
  <Link to="/gallery" aria-label="Back to all listings" className={headerBtnCls}>
    <ArrowLeft size={22} />
  </Link>
);

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(undefined); // undefined = loading, null = not found
  const [error, setError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const favorites = useFavorites();
  const [shared, setShared] = useState(false);

  useEffect(() => {
    listPublicProperties()
      .then((data) => setProperty(data.find((p) => p.id === id) || null))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-canvas">
        <ShowcaseHeader left={backButton} />
        <div className="flex items-center justify-center px-5 py-16">
          <p className="alert-error max-w-sm">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (property === undefined) {
    return (
      <div className="min-h-screen bg-canvas">
        <ShowcaseHeader left={backButton} />
        <div className="max-w-3xl mx-auto px-5 py-6">
          <div className="rounded-2xl overflow-hidden relative aspect-[4/3] sm:aspect-[16/9] skeleton" />
          <div className="mt-6 space-y-3">
            <div className="h-5 w-24 rounded-full skeleton" />
            <div className="h-7 w-2/3 rounded-md skeleton" />
            <div className="h-4 w-1/3 rounded-md skeleton" />
            <div className="h-24 w-full rounded-2xl skeleton mt-4" />
          </div>
        </div>
      </div>
    );
  }

  if (property === null) {
    return (
      <div className="min-h-screen bg-canvas">
        <ShowcaseHeader left={backButton} />
        <div className="flex flex-col items-center justify-center px-5 py-20 text-center gap-4">
          <h1 className="font-display font-bold text-2xl text-ink">This listing isn't available anymore</h1>
          <p className="text-sm text-ink/60">It may have been sold or removed.</p>
          <Link
            to="/gallery"
            className="h-12 px-7 rounded-full bg-ink text-white text-[12px] font-bold uppercase tracking-[0.12em] flex items-center justify-center"
          >
            See all listings
          </Link>
        </div>
      </div>
    );
  }

  const images = parseImages(property).map((u) => optimizedImageUrl(u, 1200));
  const attributes = parseAttributes(property);
  const attrEntries = Object.entries(attributes).filter(([, v]) => v);
  const soldOut = property.soldOut === "true" || property.soldOut === true;
  const saved = favorites.has(property.id);

  // Share sheet on phones; copies the link everywhere else.
  async function handleShare() {
    const url = window.location.href;
    const text = `${property.title}${property.location ? `, ${property.location}` : ""}${property.price ? ` (${property.price})` : ""}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: property.title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // cancelled or not allowed: nothing to do
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <ShowcaseHeader
        left={backButton}
        right={
          <>
            <button type="button" onClick={handleShare} aria-label="Share this property" className={headerBtnCls}>
              {shared ? <Check size={20} /> : <Share2 size={20} />}
            </button>
            <button
              type="button"
              onClick={() => favorites.toggle(property.id)}
              aria-pressed={saved}
              aria-label={saved ? "Remove from saved" : "Save this property"}
              className={`${headerBtnCls} ${saved ? "!bg-white !text-[#E5584A]" : ""}`}
            >
              <Heart size={20} fill={saved ? "currentColor" : "none"} />
            </button>
          </>
        }
      />

      <div className="flex-1 max-w-3xl w-full mx-auto px-5 pt-6 pb-8">
        <div className="rounded-2xl overflow-hidden border border-ink/10 relative aspect-[4/3] sm:aspect-[16/9] bg-surface">
          <div className={soldOut ? "grayscale opacity-70 w-full h-full" : "w-full h-full"}>
            <Carousel images={images} alt={property.title} showCounter onImageClick={images.length ? setLightboxIndex : undefined} intervalMs={3500} />
          </div>
          {soldOut && <SoldOutStamp size="lg" />}
        </div>

        <div className="mt-6 space-y-4">
          {property.type && (
            <span
              className="fade-up inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
              style={{ color: COLORS.teal, backgroundColor: `color-mix(in srgb, ${COLORS.teal} 10%, white)` }}
            >
              {property.type}
            </span>
          )}
          <h1 className="fade-up font-display font-bold text-[1.7rem] sm:text-3xl text-ink leading-tight" style={{ "--d": "120ms" }}>{property.title}</h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {property.location && (
              <p className="text-sm text-ink/60 flex items-center gap-1.5">
                <MapPin size={14} className="shrink-0" />
                {property.location}
              </p>
            )}
            {property.sqft && (
              <p className="text-sm text-ink/60 flex items-center gap-1.5">
                <Ruler size={14} className="shrink-0" />
                {Number(property.sqft).toLocaleString()} sqft
              </p>
            )}
          </div>

          {property.description && <p className="text-[15px] text-ink/70 leading-relaxed">{property.description}</p>}

          {attrEntries.length > 0 && (
            <div>
              <h2 className="font-display font-bold text-ink text-[17px] mb-3 mt-2">Property details</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {attrEntries.map(([k, v]) => (
                  <div key={k} className="bg-surface border border-ink/10 rounded-xl px-3.5 py-3">
                    <p className="text-[10px] uppercase tracking-wider text-ink/50 font-bold leading-none mb-1.5">{k}</p>
                    <p className="text-sm text-ink/85 font-medium">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {property.sellerNote && (
            <div className="relative bg-[#F8F2E4] border-l-4 border-gold rounded-r-2xl pl-5 pr-4 py-4">
              <Quote size={20} className="text-gold/60 absolute top-3 right-3.5" />
              <p className="text-[10px] uppercase tracking-wider text-gold-dark font-bold mb-1.5">Seller's remark</p>
              <p className="text-sm text-ink/75 italic leading-relaxed pr-6 whitespace-pre-line">{property.sellerNote}</p>
            </div>
          )}
        </div>
      </div>

      {/* Pinned bar — price and the one action that matters stay in reach */}
      <div
        className="sticky bottom-0 z-20 bg-surface border-t border-ink/10"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-ink/50 font-bold">Price</p>
            <p className={`font-display font-bold text-xl truncate ${soldOut ? "text-ink/40 line-through" : "text-ink"}`}>
              {property.price || "On request"}
            </p>
          </div>
          {soldOut ? (
            <span className="h-12 px-6 rounded-full bg-ink/10 text-ink/45 text-[12px] font-bold uppercase tracking-[0.12em] flex items-center justify-center">
              No longer available
            </span>
          ) : (
            <a
              href={whatsappLink(
                ADMIN_WHATSAPP_NUMBER,
                `Hi, I'm interested in this property: ${property.title}${property.location ? ` (${property.location})` : ""} — ${property.price || ""}${property.refId ? `\n\nProperty ref: ${property.refId}` : ""}\n\nCan you share more details?`
              )}
              target="_blank"
              rel="noreferrer"
              className="h-12 px-6 sm:px-8 rounded-full bg-whatsapp text-white text-[12px] font-bold uppercase tracking-[0.12em] flex items-center justify-center shrink-0"
            >
              I'm interested
            </a>
          )}
        </div>
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox images={images} initialIndex={lightboxIndex} alt={property.title} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  );
}
