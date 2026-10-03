import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, Share2, Check } from "lucide-react";
import { optimizedImageUrl } from "../../lib/cloudinary";

/**
 * Full-screen photo viewer ("Gallery View"): big photo, swipe or arrows to
 * move, a strip of thumbnails underneath, heart and share up top.
 *
 * Lessons from the old lightbox: it mounts straight into <body> (so no
 * transformed parent can break "fixed"), a swipe never counts as a tap,
 * neighbouring photos are preloaded, and page scroll is locked without a jump.
 */
export default function ImmersiveViewer({ images, startIndex = 0, title, saved, onToggleSaved, onShare, shared, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const closeRef = useRef(onClose);
  const stripRef = useRef(null);
  const startX = useRef(null);
  const startY = useRef(null);
  const count = images.length;

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % count);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + count) % count);
    }
    window.addEventListener("keydown", onKey);
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (sbw > 0) body.style.paddingRight = `${sbw}px`;
    return () => {
      window.removeEventListener("keydown", onKey);
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
    };
  }, [count]);

  useEffect(() => {
    if (count < 2) return;
    [(index + 1) % count, (index - 1 + count) % count].forEach((n) => {
      const img = new Image();
      img.src = optimizedImageUrl(images[n], 1600);
    });
    // keep the current thumbnail in view
    stripRef.current?.querySelector(`[data-i="${index}"]`)?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [index, count, images]);

  function go(delta) {
    setIndex((i) => (i + delta + count) % count);
  }
  function onTouchStart(e) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }
  function onTouchEnd(e) {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    startX.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && count > 1) go(dx < 0 ? 1 : -1);
  }

  const btn = "w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors active:scale-95";

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-[#070E1E] flex flex-col animate-[lightboxFade_0.2s_ease_both]"
      role="dialog"
      aria-modal="true"
      aria-label={`${title}, photos`}
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <button type="button" onClick={onClose} aria-label="Close photos" className={btn}>
          <ArrowLeft size={22} />
        </button>
        <p className="text-center font-display font-semibold text-white text-[1.05rem] truncate px-2">Gallery view</p>
        <div className="flex gap-2">
          {onToggleSaved && (
            <button
              type="button"
              onClick={onToggleSaved}
              aria-pressed={saved}
              aria-label={saved ? "Remove from saved" : "Save this property"}
              className={`${btn} ${saved ? "!bg-white !text-[#E5584A]" : ""}`}
            >
              <Heart size={20} fill={saved ? "currentColor" : "none"} />
            </button>
          )}
          {onShare && (
            <button type="button" onClick={onShare} aria-label="Share this property" className={btn}>
              {shared ? <Check size={20} /> : <Share2 size={20} />}
            </button>
          )}
        </div>
      </div>

      <div
        className="relative flex-1 min-h-0 mt-3 select-none"
        style={{ touchAction: "pan-y" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {images.map((src, i) => (
          <img
            key={src}
            src={optimizedImageUrl(src, 1600)}
            alt={i === index ? `${title}, photo ${i + 1} of ${count}` : ""}
            aria-hidden={i !== index}
            draggable={false}
            className={`absolute inset-0 w-full h-full object-contain p-2 sm:p-6 transition-opacity duration-500 ${i === index ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 text-white text-[13px] font-semibold px-4 py-1.5">
          Photo {index + 1} of {count}
        </span>
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className={`${btn} hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2`}>
              <ChevronLeft size={24} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next photo" className={`${btn} hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2`}>
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div
          ref={stripRef}
          className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 pt-3"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          role="tablist"
          aria-label="Photos"
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              role="tab"
              data-i={i}
              aria-selected={i === index}
              aria-label={`Show photo ${i + 1}`}
              onClick={() => setIndex(i)}
              className="shrink-0 flex flex-col items-center gap-1.5"
            >
              <span className={`block w-[4.6rem] h-[3.4rem] rounded-xl overflow-hidden ring-2 transition ${i === index ? "ring-[#E6C173]" : "ring-transparent opacity-70"}`}>
                <img src={optimizedImageUrl(src, 200)} alt="" className="w-full h-full object-cover" draggable={false} />
              </span>
              <span className={`text-[11px] font-semibold ${i === index ? "text-white" : "text-white/55"}`}>Photo {i + 1}</span>
            </button>
          ))}
        </div>
      )}
      {count <= 1 && <div style={{ height: "max(1rem, env(safe-area-inset-bottom))" }} />}
    </div>,
    document.body
  );
}
