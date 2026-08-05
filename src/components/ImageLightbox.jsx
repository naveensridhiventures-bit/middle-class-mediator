import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Fullscreen, attractive image viewer — tap a photo to open it big, swipe
 * through the rest, tap outside or the X to close.
 */
export default function ImageLightbox({ images, initialIndex = 0, alt = "Photo", onClose }) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [images.length, onClose]);

  function go(delta, e) {
    e.stopPropagation();
    setIndex((i) => (i + delta + images.length) % images.length);
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-ink/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-[fadeInUp_0.25s_ease_both]"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition z-10"
      >
        <X size={20} />
      </button>

      {images.length > 1 && (
        <span className="absolute top-4 left-4 sm:top-6 sm:left-6 text-white/70 text-sm font-semibold tracking-wide">
          {index + 1} / {images.length}
        </span>
      )}

      <img
        src={images[index]}
        alt={`${alt} ${index + 1}`}
        className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl select-none"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => go(-1, e)}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => go(1, e)}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <ChevronRight size={22} />
          </button>
          <div className="absolute bottom-5 sm:bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: i === index ? 22 : 7, backgroundColor: i === index ? "#fff" : "rgba(255,255,255,0.4)" }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
