// Tiny gold lights drifting upward. Positions are generated from a fixed
// formula (not Math.random) so they stay put across re-renders.
const PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const r = (n) => {
    const x = Math.sin(i * 97.13 + n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  return {
    left: `${Math.round(r(1) * 100)}%`,
    size: 2 + Math.round(r(2) * 4),
    dur: 9 + r(3) * 9,
    delay: -r(4) * 16,
    drift: Math.round((r(5) - 0.5) * 70),
  };
});

export default function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            "--dur": `${p.dur}s`,
            "--delay": `${p.delay}s`,
            "--drift": `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
