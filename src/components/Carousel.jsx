import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Home as HomeIcon } from "lucide-react";

/**
 * Shared sliding image carousel (real translateX slide with easing,
 * autoplay, pause-on-hover, dot indicators, arrow buttons) used by both
 * the public Gallery and the admin CRM lead cards, so both look and move
 * identically.
 *
 * Touch fixes:
 *  - hover-pause only reacts to a real mouse (touch used to leave it
 *    "stuck" paused via emulated mouse events)
 *  - a swipe no longer fires a click (which used to pop the lightbox open)
 *  - images can't be dragged / long-press-previewed into a ghost image
 *  - the next/previous slide is preloaded so sliding never shows a blank
 *  - autoplay only runs while the carousel is actually on screen
 */
export default function Carousel({ images, alt = "Photo", intervalMs = 2800, className = "", showCounter = false, onImageClick }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const rootRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const touchDeltaX = useRef(0);
  const touchDeltaY = useRef(0);
  const swiped = useRef(false);
  const count = images ? images.length : 0;

  // Only autoplay / preload while visible (saves battery + bandwidth).
  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.1 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [count]);

  useEffect(() => {
    if (count <= 1 || paused || !inView) return undefined;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [count, paused, inView, intervalMs]);

  // Preload neighbours so the slide animation never reveals an empty frame.
  useEffect(() => {
    if (count <= 1 || !inView) return;
    [(index + 1) % count, (index - 1 + count) % count].forEach((n) => {
      const img = new Image();
      img.src = images[n];
    });
  }, [index, count, inView, images]);

  function go(delta, e) {
    if (e) e.stopPropagation();
    setIndex((i) => (i + delta + count) % count);
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaX.current = 0;
    touchDeltaY.current = 0;
    swiped.current = false;
    setPaused(true);
  }
  function handleTouchMove(e) {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    touchDeltaY.current = e.touches[0].clientY - touchStartY.current;
    // Mark as a swipe gesture so the click that may follow is ignored.
    if (Math.abs(touchDeltaX.current) > 10 && Math.abs(touchDeltaX.current) > Math.abs(touchDeltaY.current)) {
      swiped.current = true;
    }
  }
  function handleTouchEnd() {
    if (Math.abs(touchDeltaX.current) > 40 && Math.abs(touchDeltaX.current) > Math.abs(touchDeltaY.current)) {
      go(touchDeltaX.current < 0 ? 1 : -1);
    }
    resetTouch();
  }
  function resetTouch() {
    touchStartX.current = null;
    touchStartY.current = null;
    touchDeltaX.current = 0;
    touchDeltaY.current = 0;
    setPaused(false);
  }

  function handleClick() {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    if (onImageClick) onImageClick(index);
  }

  if (!images || count === 0) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-ink/5 to-ink/10 ${className}`}>
        <HomeIcon size={26} className="text-ink/20" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`relative w-full h-full overflow-hidden group touch-pan-y select-none ${className}`}
      onPointerEnter={(e) => { if (e.pointerType === "mouse") setPaused(true); }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse") setPaused(false); }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={resetTouch}
    >
      <div
        className={`flex h-full will-change-transform transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${onImageClick ? "cursor-zoom-in" : ""}`}
        style={{
          width: `${count * 100}%`,
          transform: `translate3d(-${index * (100 / count)}%, 0, 0)`,
          backfaceVisibility: "hidden",
        }}
        onClick={handleClick}
      >
        {images.map((src, i) => (
          <div key={i} className="h-full overflow-hidden" style={{ width: `${100 / count}%` }}>
            <img
              src={src}
              alt={`${alt} ${i + 1}`}
              className="w-full h-full object-cover pointer-events-none select-none"
              style={{ WebkitTouchCallout: "none", WebkitUserDrag: "none" }}
              draggable={false}
              loading={i === 0 ? "lazy" : "eager"}
              decoding="async"
            />
          </div>
        ))}
      </div>

      {count > 1 && (
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
                aria-label={`Photo ${i + 1}`}
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
              {index + 1}/{count}
            </span>
          )}
        </>
      )}
    </div>
  );
}
