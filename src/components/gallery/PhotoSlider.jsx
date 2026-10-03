import { useEffect, useRef, useState } from "react";

/**
 * Swipeable hero photo for the property page. Photos crossfade while the
 * active one slowly pushes in. Swiping changes photo; a tap (not a swipe)
 * calls onOpen so the full-screen viewer can open.
 *
 * Render `children` for anything that should sit on top (buttons, counter).
 * `onIndexChange` reports the current photo so the counter can follow.
 */
export default function PhotoSlider({ images, alt, onOpen, onIndexChange, className = "", children, overlayClass = "" }) {
  const [index, setIndex] = useState(0);
  const startX = useRef(null);
  const startY = useRef(null);
  const swiped = useRef(false);
  const count = images.length;
  const safe = count ? index % count : 0;

  useEffect(() => {
    onIndexChange?.(safe);
  }, [safe, onIndexChange]);

  // Warm up the neighbours so a swipe never shows an empty frame.
  useEffect(() => {
    if (count < 2) return;
    [(safe + 1) % count, (safe - 1 + count) % count].forEach((n) => {
      const img = new Image();
      img.src = images[n];
    });
  }, [safe, count, images]);

  function go(delta) {
    setIndex((i) => (i + delta + count) % count);
  }
  function onTouchStart(e) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    swiped.current = false;
  }
  function onTouchMove(e) {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) swiped.current = true;
  }
  function onTouchEnd(e) {
    if (startX.current !== null) {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    }
    startX.current = null;
  }
  function onClick() {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    onOpen?.(safe);
  }

  return (
    <div
      className={`relative isolate overflow-hidden bg-ink-dark touch-pan-y select-none ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      role="group"
      aria-roledescription="carousel"
      aria-label={`${alt} photos`}
    >
      {count === 0 ? (
        <div className="absolute inset-0 bg-gradient-to-br from-ink-light to-ink-dark" />
      ) : (
        images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={i === safe ? `${alt}, photo ${i + 1} of ${count}` : ""}
            aria-hidden={i !== safe}
            draggable={false}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-[800ms] ease-out ${
              i === safe ? "opacity-100 feat-ken" : "opacity-0"
            }`}
          />
        ))
      )}
      {/* Tapping anywhere on the photo opens the viewer */}
      {count > 0 && onOpen && (
        <button type="button" onClick={onClick} aria-label="Open photos full screen" className="absolute inset-0 z-[1] cursor-zoom-in" />
      )}
      <div className={`absolute inset-0 z-[2] pointer-events-none ${overlayClass}`}>{children}</div>
    </div>
  );
}
