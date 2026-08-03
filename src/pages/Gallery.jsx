import { useEffect, useRef, useState } from "react";
import { Handshake, MapPin, Home as HomeIcon, Ruler, ChevronLeft, ChevronRight } from "lucide-react";
import { listPublicProperties } from "../lib/api";
import { whatsappLink } from "../lib/whatsapp";
import { ADMIN_WHATSAPP_NUMBER } from "../lib/config";

function parseImages(p) {
  if (p.images) {
    try {
      const parsed = JSON.parse(p.images);
      if (Array.isArray(parsed) && parsed.length) return parsed.filter(Boolean);
    } catch {
      // fall through to single imageUrl below
    }
  }
  return p.imageUrl ? [p.imageUrl] : [];
}

function Carousel({ images, alt }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (images.length <= 1) return undefined;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 3200);
    return () => clearInterval(timerRef.current);
  }, [images.length]);

  function go(delta) {
    clearInterval(timerRef.current);
    setIndex((i) => (i + delta + images.length) % images.length);
  }

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <HomeIcon size={28} className="text-ink/20" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden group">
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`${alt} ${i + 1}`}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out"
          style={{
            opacity: i === index ? 1 : 0,
            transform: i === index ? "scale(1)" : "scale(1.05)",
          }}
        />
      ))}

      {images.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-ink/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-ink/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
          >
            <ChevronRight size={15} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === index ? 16 : 6,
                  backgroundColor: i === index ? "#fff" : "rgba(255,255,255,0.5)",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Gallery() {
  const [properties, setProperties] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listPublicProperties()
      .then(setProperties)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="bg-ink text-paper">
        <div className="max-w-6xl mx-auto px-5 py-10 sm:py-14 text-center">
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

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-5 py-10">
        {error && <p className="text-buyer text-sm text-center">{error}</p>}
        {properties === null && !error && <p className="text-ink/50 text-sm text-center">Loading…</p>}
        {properties !== null && properties.length === 0 && (
          <p className="text-ink/50 text-sm text-center">No listings published yet — check back soon.</p>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties?.map((p) => {
            const images = parseImages(p);
            return (
              <div key={p.id} className="rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="aspect-[4/3] bg-ink/5">
                  <Carousel images={images} alt={p.title} />
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
                  </div>
                  {p.description && <p className="text-xs text-ink/50">{p.description}</p>}
                  {p.price && <p className="font-display font-bold text-ink text-lg pt-1">{p.price}</p>}
                  <a
                    href={whatsappLink(
                      ADMIN_WHATSAPP_NUMBER,
                      `Hi, I'm interested in this property: ${p.title}${p.location ? ` (${p.location})` : ""} — ${p.price || ""}${p.refId ? `\n\nProperty ref: ${p.refId}` : ""}\n\nCan you share more details?`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-whatsapp w-full !py-2.5 text-sm block text-center mt-2"
                  >
                    Show interest on WhatsApp
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
