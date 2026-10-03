import { useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { MapPin, ExternalLink } from "lucide-react";
import useProperties from "../lib/useProperties";
import useFavorites from "../lib/useFavorites";
import { optimizedImageUrl } from "../lib/cloudinary";
import TopBar from "../components/gallery/TopBar";
import ImmersiveViewer from "../components/gallery/ImmersiveViewer";

/** "Image Gallery": every photo as a grid, plus a Location tab with an area map. */
export default function GalleryPhotos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { properties, error } = useProperties();
  const favorites = useFavorites();
  const [viewerIndex, setViewerIndex] = useState(null);
  const tab = params.get("tab") === "location" ? "location" : "photos";

  const listing = properties ? properties.find((p) => p.id === id) || null : undefined;
  const back = () => navigate(`/gallery/${id}`);

  if (listing === undefined || listing === null || error) {
    return (
      <div className="min-h-screen bg-canvas">
        <TopBar dark title="Image Gallery" onBack={back} />
        <div className="px-5 py-14 text-center">
          {error ? <p className="alert-error max-w-sm mx-auto">{error}</p> : listing === null ? (
            <>
              <p className="font-display font-bold text-xl text-ink">This property isn't available anymore</p>
              <Link to="/gallery" className="inline-block mt-4 text-[14px] font-bold text-[#8A6218]">See all properties</Link>
            </>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square rounded-xl skeleton" />)}
            </div>
          )}
        </div>
      </div>
    );
  }

  const l = listing;
  const count = l.images.length;
  const mapQuery = encodeURIComponent(l.location || l.area || "Chennai");
  const saved = favorites.has(l.id);

  const tabBtn = (key, label) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === key}
      onClick={() => setParams(key === "photos" ? {} : { tab: key }, { replace: true })}
      className={`flex-1 h-11 rounded-xl text-[14px] font-semibold transition-colors ${tab === key ? "bg-ink-dark text-white" : "text-ink/65 hover:text-ink"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <TopBar dark title="Image Gallery" onBack={back} />

      <div className="max-w-3xl mx-auto px-4 pt-4 pb-10">
        <p className="font-display font-bold text-[1.15rem] text-ink truncate">{l.title}</p>

        <div role="tablist" aria-label="Photos or location" className="mt-3 flex gap-1.5 rounded-2xl bg-[#E9E3D9] p-1.5">
          {tabBtn("photos", `Photos (${count})`)}
          {tabBtn("location", "Location")}
        </div>

        {tab === "photos" ? (
          count === 0 ? (
            <p className="mt-10 text-center text-sm text-ink/55">No photos have been added to this property yet.</p>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              {l.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setViewerIndex(i)}
                  aria-label={`Open photo ${i + 1} of ${count}`}
                  className="tile group relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-ink-dark active:scale-95 transition-transform"
                >
                  <img
                    src={optimizedImageUrl(src, 400)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${l.sold ? "grayscale" : ""}`}
                  />
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="mt-4">
            <div className="flex items-start gap-2.5 rounded-2xl bg-surface ring-1 ring-ink/[0.07] px-4 py-3.5">
              <MapPin size={20} className="shrink-0 mt-0.5 text-[#A8782A]" />
              <div>
                <p className="text-[15px] font-semibold text-ink">{l.location || "Chennai"}</p>
                <p className="text-[12.5px] text-ink/55 mt-0.5">This map shows the general area only, not the exact address.</p>
              </div>
            </div>
            <div className="mt-3 rounded-2xl overflow-hidden ring-1 ring-ink/10 bg-ink/5 aspect-[4/3]">
              <iframe
                title={`Map of ${l.location || "the area"}`}
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 h-12 rounded-2xl border border-ink/20 text-ink text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-ink/5 transition-colors"
            >
              <ExternalLink size={16} />
              Open in Google Maps
            </a>
          </div>
        )}
      </div>

      {viewerIndex !== null && (
        <ImmersiveViewer
          images={l.images}
          startIndex={viewerIndex}
          title={l.title}
          saved={saved}
          onToggleSaved={l.sold ? undefined : () => favorites.toggle(l.id)}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}
