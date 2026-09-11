import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Home as HomeIcon } from "lucide-react";

/**
 * Shared sliding image carousel (real translateX slide with easing,
 * autoplay, pause-on-hover, dot indicators, arrow buttons) used by both
 * the public Gallery and the admin CRM lead cards, so both look and move
 * identically.
 */
export default function Carousel({ images, alt = "Photo", intervalMs = 2800, className = "", showCounter = false, onImageClick }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const touchStartX = useRef(null);
  const touchDeltaX = useRef(0);

  useEffect(() => {
    if (!images || images.length <= 1 || paused) return undefined;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(timerRef.current);
  }, [images, images?.length, paused, intervalMs]);

  function go(delta, e) {
    if (e) e.stopPropagation();
    setIndex((i) => (i + delta + images.length) % images.length);
  }

  // Swipe support — arrows are hover-only on desktop, but touch devices
  // have no hover state, so without this a mobile visitor had no way to
  // move through a multi-photo listing besides tapping the tiny dots.
  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    setPaused(true);
  }
  function handleTouchMove(e) {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  }
  function handleTouchEnd() {
    if (Math.abs(touchDeltaX.current) > 40) {
      go(touchDeltaX.current < 0 ? 1 : -1);
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
    setPaused(false);
  }

  if (!images || images.length === 0) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-ink/5 to-ink/10 ${className}`}>
        <HomeIcon size={26} className="text-ink/20" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full overflow-hidden group touch-pan-y ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`flex h-full transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${onImageClick ? "cursor-zoom-in" : ""}`}
        style={{ width: `${images.length * 100}%`, transform: `translateX(-${index * (100 / images.length)}%)` }}
        onClick={() => onImageClick && onImageClick(index)}
      >
        {images.map((src, i) => (
          <div key={i} className="h-full" style={{ width: `${100 / images.length}%` }}>
            <img src={src} alt={`${alt} ${i + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent pointer-events-none" />
          <button
            onClick={(e) => go(-1, e)}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-7 sm:h-7 rounded-full bg-white/90 text-ink flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 active:scale-90 transition shadow-md"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={(e) => go(1, e)}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-7 sm:h-7 rounded-full bg-white/90 text-ink flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 active:scale-90 transition shadow-md"
          >
            <ChevronRight size={14} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === index ? 16 : 6,
                  backgroundColor: i === index ? "#fff" : "rgba(255,255,255,0.55)",
                }}
              />
            ))}
          </div>
          {showCounter && (
            <span className="absolute top-2.5 right-2.5 text-[10px] font-bold bg-ink/60 text-white px-2 py-0.5 rounded-full">
              {index + 1}/{images.length}
            </span>
          )}
        </>
      )}
    </div>
  );
}
