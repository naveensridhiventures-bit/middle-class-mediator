const COLORS = ["#C99A4A", "#E6C173", "#E5584A", "#1F6F5C", "#3F5F8F", "#1B2A4A"];

// Deterministic "random" so render stays pure and the burst looks the same every time.
const rnd = (i, k) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * A one-shot burst of sparks (small) or confetti (big) from the centre of its
 * positioned parent. Change `fire` to a new number to play it again.
 */
export default function Burst({ fire, count = 12, spread = 46, big = false }) {
  if (!fire) return null;
  return (
    <span key={fire} className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2 + rnd(i, 1) * 0.6;
        const d = spread * (0.65 + rnd(i, 2) * 0.7);
        const dx = Math.cos(a) * d;
        const dy = Math.sin(a) * d - (big ? spread * 0.35 : 0);
        return (
          <i
            key={i}
            className={big ? "burst-bit burst-big" : "burst-bit"}
            style={{
              "--dx": `${dx}px`,
              "--dy": `${dy}px`,
              "--fall": `${big ? 60 + rnd(i, 3) * 60 : 0}px`,
              "--rot": `${Math.round((rnd(i, 4) - 0.5) * 720)}deg`,
              "--c": COLORS[i % COLORS.length],
              "--w": big ? `${6 + rnd(i, 5) * 5}px` : "6px",
              "--h": big ? `${9 + rnd(i, 6) * 8}px` : "6px",
              animationDelay: `${Math.round(rnd(i, 7) * 90)}ms`,
            }}
          />
        );
      })}
    </span>
  );
}
