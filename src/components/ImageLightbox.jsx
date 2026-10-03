import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Fullscreen image viewer — tap a photo to open it big, swipe (or use the
 * arrows / keyboard) through the rest, tap outside or the X to close.
 *
 * Glitch fixes:
 *  - Rendered through a portal into <body>. It used to render inside the
 *    gallery card, and because that card sits inside CSS transforms
 *    (scroll-reveal + hover lift), `position: fixed` was relative to the
 *    card instead of the screen — so the "fullscreen" viewer was clipped
 *    and jumped around inside the card.
 *  - No backdrop-blur and no translate animation (both flicker on phones);
 *    it's a plain opacity fade now.
 *  - onClose is held in a ref so parent re-renders don't tear down and
 *    re-create the scroll lock (that caused a layout jump).
 *  - Neighbouring photos are preloaded and each photo fades in, so
 *    switching never flashes blank.
 *  - Real swipe support (the old comment promised it, the code had none).
 */
export default function ImageLightbox({ images, initialIndex = 0, alt = "Photo", onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const onCloseRef = useRef(onClose);
  const startX = useRef(null);
  const startY = useRef(null);
  const swiped = useRef(false);
  const count = images.length;

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Keyboard + body scroll lock (without the page shifting sideways).
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onCloseRef.current();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % count);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + count) % count);
    }
    window.addEventListener("keydown", handleKey);

    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      window.removeEventListener("keydown", handleKey);
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [count]);

  // Preload neighbours so switching photos never flashes empty.
  useEffect(() => {
    if (count <= 1) return;
    [(index + 1) % count, (index - 1 + count) % count].forEach((n) => {
      const img = new Image();
      img.src = images[n];
    });
  }, [index, count, images]);

  function go(delta, e) {
    if (e) e.stopPropagation();
    setIndex((i) => (i + delta + count) % count);
  }

  function handleTouchStart(e) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    swiped.current = false;
  }
  function handleTouchEnd(e) {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    startX.current = null;
    startY.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && count > 1) {
      swiped.current = true;
      setIndex((i) => (i + (dx < 0 ? 1 : -1) + count) % count);
    }
  }
  function handleBackdropClick() {
    // A swipe can be followed by a synthetic click — don't close on that.
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    onClose();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-ink/95 flex items-center justify-center p-4 sm:p-8 overscroll-contain animate-[lightboxFade_0.2s_ease_both]"
      style={{ touchAction: "none" }}
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} photos`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition z-10"
      >
        <X size={20} />
      </button>

      {count > 1 && (
        <span className="absolute top-4 left-4 sm:top-6 sm:left-6 text-white/70 text-sm font-semibold tracking-wide">
          {index + 1} / {count}
        </span>
      )}

      <img
        key={index}
        src={images[index]}
        alt={`${alt} ${index + 1}`}
        draggable={false}
        className="max-w-full max-h-[85vh] max-h-[85dvh] object-contain rounded-2xl shadow-2xl select-none animate-[lightboxFade_0.2s_ease_both]"
        style={{ WebkitTouchCallout: "none", WebkitUserDrag: "none" }}
        onClick={(e) => e.stopPropagation()}
      />

      {count > 1 && (
        <>
          <button
            onClick={(e) => go(-1, e)}
            aria-label="Previous photo"
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => go(1, e)}
            aria-label="Next photo"
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <ChevronRight size={22} />
          </button>
          <div className="absolute bottom-5 sm:bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                aria-label={`Photo ${i + 1}`}
                onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: i === index ? 22 : 7, backgroundColor: i === index ? "#fff" : "rgba(255,255,255,0.4)" }}
              />
            ))}
          </div>
        </>
      )}
    </div>,
    document.body
  );
}
