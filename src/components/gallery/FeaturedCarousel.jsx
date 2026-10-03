import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Sparkles } from "lucide-react";

/**
 * Big "Featured" slider at the top of the gallery.
 *
 *  - Crossfades between listings while the photo slowly pushes in
 *  - The title's words rise one by one each time the slide changes
 *  - The active dot fills like a progress bar, showing when the next slide comes
 *  - Swipe on a phone, arrows on a computer, tap anywhere to open the listing
 *  - Autoplay only runs while it is on screen, and not at all if the device
 *    asks for reduced motion
 *  - A tiny 3D tilt follows the mouse on desktop
 *
 * items: [{ id, title, location, price, image }]
 */
export default function FeaturedCarousel({ items, interval = 5200 }) {
  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0); // bump to restart the timer + progress dot
  const [holding, setHolding] = useState(false);
  const [inView, setInView] = useState(true);
  const rootRef = useRef(null);
  const tiltRef = useRef(null);
  const startX = useRef(null);
  const startY = useRef(null);
  const swiped = useRef(false);

  const count = items.length;
  const current = count ? index % count : 0;
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const playing = count > 1 && !holding && inView && !reduced;

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setTimeout(() => {
      setIndex((i) => (i + 1) % count);
    }, interval);
    return () => clearTimeout(timer);
  }, [playing, current, cycle, count, interval]);

  // Warm up the next photo so the crossfade never shows an empty frame.
  useEffect(() => {
    if (count < 2) return;
    const img = new Image();
    img.src = items[(current + 1) % count].image;
  }, [current, count, items]);

  function go(delta) {
    setIndex((i) => (i + delta + count) % count);
    setCycle((c) => c + 1);
  }

  function onTouchStart(e) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    swiped.current = false;
    setHolding(true);
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
    startY.current = null;
    setHolding(false);
    setCycle((c) => c + 1);
  }
  function onTouchCancel() {
    startX.current = null;
    setHolding(false);
    setCycle((c) => c + 1);
  }

  // Desktop only: gentle tilt toward the pointer.
  function onPointerMove(e) {
    if (e.pointerType !== "mouse" || !tiltRef.current) return;
    const r = tiltRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    tiltRef.current.style.setProperty("--rx", `${(-py * 3).toFixed(2)}deg`);
    tiltRef.current.style.setProperty("--ry", `${(px * 4).toFixed(2)}deg`);
  }
  function onPointerLeave() {
    tiltRef.current?.style.setProperty("--rx", "0deg");
    tiltRef.current?.style.setProperty("--ry", "0deg");
  }

  if (count === 0) return null;
  const active = items[current];
  const words = active.title.split(/\s+/);

  return (
    <div ref={rootRef} className="featured-wrap">
      <div
        ref={tiltRef}
        className="featured-card relative isolate overflow-hidden rounded-3xl w-full bg-ink-dark aspect-[16/11] sm:aspect-[21/9] sm:max-h-[26rem] shadow-[0_18px_40px_-18px_rgba(10,17,36,0.65)]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured properties"
      >
        {items.map((it, i) => (
          <div
            key={it.id}
            className={`absolute inset-0 -z-10 transition-opacity duration-[900ms] ease-out ${i === current ? "opacity-100" : "opacity-0"}`}
            aria-hidden={i !== current}
          >
            <img
              src={it.image}
              alt=""
              className={`w-full h-full object-cover ${i === current ? "feat-ken" : ""}`}
              draggable={false}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          </div>
        ))}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-dark/90 via-ink-dark/25 to-transparent" aria-hidden="true" />

        {/* Whole card opens the listing; swipes don't count as taps */}
        <Link
          to={`/gallery/${active.id}`}
          aria-label={`Open ${active.title}`}
          className="absolute inset-0 z-10 cursor-pointer"
          onClick={(e) => {
            if (swiped.current) {
              e.preventDefault();
              swiped.current = false;
            }
          }}
        />

        <div key={active.id} className="absolute left-5 right-16 bottom-9 sm:bottom-11 z-10 pointer-events-none text-left">
          <span className="feat-pill inline-flex items-center gap-1.5 rounded-full bg-[#98691F] text-white text-[12px] font-bold px-3 py-1 shadow-md">
            <Sparkles size={12} />
            Featured
          </span>
          <h2 className={`mt-2.5 font-display font-bold text-white sm:text-4xl leading-[1.1] text-balance drop-shadow ${active.title.length > 28 ? "text-[1.28rem]" : "text-[1.55rem]"}`}>
            {words.map((w, i) => (
              <span key={`${w}-${i}`}>
                <span className="mask-word">
                  <span className="mask-inner" style={{ "--d": `${140 + i * 70}ms` }}>{w}</span>
                </span>{" "}
              </span>
            ))}
          </h2>
          <p className="feat-meta mt-2 flex items-center gap-3 text-white/90 text-[14px]">
            {active.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} />
                {active.location}
              </span>
            )}
            {active.price && <span className="font-display font-bold text-[#F3D98B]">{active.price}</span>}
          </p>
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous featured property"
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/85 text-ink items-center justify-center hover:bg-white active:scale-90 transition"
            >
              <ChevronLeft size={20} strokeWidth={2.6} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next featured property"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white text-ink flex items-center justify-center shadow-lg active:scale-90 transition hover:scale-105"
            >
              <ChevronRight size={22} strokeWidth={2.6} />
            </button>

            <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
              {items.map((it, i) => {
                const on = i === current;
                return (
                  <button
                    key={it.id}
                    type="button"
                    aria-label={`Show ${it.title}`}
                    aria-current={on}
                    onClick={() => {
                      setIndex(i);
                      setCycle((c) => c + 1);
                    }}
                    className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-500 ${on ? "w-8 bg-white/35" : "w-1.5 bg-white/60"}`}
                  >
                    {on && (
                      <span
                        key={`${current}-${cycle}-${playing}`}
                        className={`absolute inset-0 rounded-full bg-white origin-left ${playing ? "fill-bar" : ""}`}
                        style={{ "--ms": `${interval}ms`, transform: playing ? undefined : "scaleX(1)" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
