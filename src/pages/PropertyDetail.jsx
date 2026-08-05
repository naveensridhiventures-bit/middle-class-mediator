import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Handshake, MapPin, Ruler, ArrowLeft } from "lucide-react";
import { listPublicProperties } from "../lib/api";
import { whatsappLink } from "../lib/whatsapp";
import { ADMIN_WHATSAPP_NUMBER } from "../lib/config";
import { optimizedImageUrl } from "../lib/cloudinary";
import Carousel from "../components/Carousel";
import SoldOutStamp from "../components/SoldOutStamp";
import ImageLightbox from "../components/ImageLightbox";

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

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(undefined); // undefined = loading, null = not found
  const [error, setError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    listPublicProperties()
      .then((data) => setProperty(data.find((p) => p.id === id) || null))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-5">
        <p className="text-buyer text-sm">{error}</p>
      </div>
    );
  }

  if (property === undefined) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-5">
        <p className="text-ink/50 text-sm">Loading…</p>
      </div>
    );
  }

  if (property === null) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-5 text-center gap-4">
        <p className="text-ink/60 text-sm">This listing isn't available anymore.</p>
        <Link to="/gallery" className="btn-primary !py-2.5 !px-5 text-sm">
          <ArrowLeft size={14} className="inline -mt-0.5 mr-1.5" />
          Back to all listings
        </Link>
      </div>
    );
  }

  const images = parseImages(property).map((u) => optimizedImageUrl(u, 1200));
  const attributes = parseAttributes(property);
  const attrEntries = Object.entries(attributes).filter(([, v]) => v);
  const soldOut = property.soldOut === "true" || property.soldOut === true;

  return (
    <div className="min-h-screen bg-paper">
      <div className="bg-ink text-paper">
        <div className="max-w-3xl mx-auto px-5 py-6 flex items-center justify-between">
          <Link to="/gallery" className="flex items-center gap-1.5 text-sm text-paper/70 hover:text-paper transition">
            <ArrowLeft size={16} />
            All listings
          </Link>
          <div className="relative w-9 h-9">
            <div className="w-9 h-9 rounded-full border-2 border-gold flex items-center justify-center">
              <span className="font-display font-bold text-gold text-[9px] tracking-wide">MCM</span>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gold flex items-center justify-center">
              <Handshake size={7} className="text-ink" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-8">
        <div className="rounded-3xl overflow-hidden shadow-xl relative aspect-[4/3] sm:aspect-[16/9]">
          <div className={soldOut ? "grayscale opacity-70 w-full h-full" : "w-full h-full"}>
            <Carousel images={images} alt={property.title} showCounter onImageClick={images.length ? setLightboxIndex : undefined} intervalMs={3500} />
          </div>
          {soldOut && <SoldOutStamp size="lg" />}
        </div>

        <div className="mt-6 space-y-3">
          {property.type && (
            <span className="inline-block text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-seller/10 text-seller">
              {property.type}
            </span>
          )}
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink leading-snug">{property.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {property.location && (
              <p className="text-sm text-ink/50 flex items-center gap-1.5">
                <MapPin size={14} className="shrink-0" />
                {property.location}
              </p>
            )}
            {property.sqft && (
              <p className="text-sm text-ink/50 flex items-center gap-1.5">
                <Ruler size={14} className="shrink-0" />
                {Number(property.sqft).toLocaleString()} sqft
              </p>
            )}
          </div>
          {property.price && (
            <p className={`font-display font-bold text-2xl ${soldOut ? "text-ink/40 line-through" : "text-ink"}`}>
              {property.price}
            </p>
          )}
          {property.description && <p className="text-sm text-ink/60">{property.description}</p>}

          {attrEntries.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              {attrEntries.map(([k, v]) => (
                <div key={k} className="bg-white rounded-xl px-3 py-2.5 shadow-sm">
                  <p className="text-[10px] uppercase tracking-wide text-ink/35 font-bold leading-none mb-1">{k}</p>
                  <p className="text-sm text-ink/70 font-medium">{v}</p>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4">
            {soldOut ? (
              <span className="w-full py-3.5 text-sm text-center rounded-xl bg-ink/10 text-ink/40 font-semibold flex items-center justify-center">
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
                className="btn-whatsapp w-full !py-3.5 text-base text-center block"
              >
                Show interest on WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox images={images} initialIndex={lightboxIndex} alt={property.title} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  );
}
