import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Handshake, MapPin, Home as HomeIcon } from "lucide-react";
import { listPublicProperties } from "../lib/api";

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
            Curated listings from our sellers. Like something? Register your interest and our team
            will reach out with the full details.
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
          {properties?.map((p) => (
            <div key={p.id} className="rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="aspect-[4/3] bg-ink/5">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <HomeIcon size={28} className="text-ink/20" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="p-5 space-y-2">
                {p.type && (
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-seller/10 text-seller">
                    {p.type}
                  </span>
                )}
                <h3 className="font-display font-semibold text-lg text-ink leading-snug">{p.title}</h3>
                {p.location && (
                  <p className="text-xs text-ink/50 flex items-center gap-1">
                    <MapPin size={12} className="shrink-0" />
                    {p.location}
                  </p>
                )}
                {p.description && <p className="text-xs text-ink/50">{p.description}</p>}
                {p.price && <p className="font-display font-bold text-ink text-lg pt-1">{p.price}</p>}
                <Link to="/buyer" className="btn-primary w-full !py-2.5 text-sm block text-center mt-2">
                  Interested — register as buyer
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
