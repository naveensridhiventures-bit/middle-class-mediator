import { useEffect, useRef } from "react";

/** A voice-note shape: bars from the recording's loudness, filled as it plays. */
export function Wave({ peaks, progress = 0, height = 36, className = "" }) {
  const bars = peaks && peaks.length ? peaks : Array.from({ length: 40 }, (_, i) => 30 + ((i * 37) % 40));
  return (
    <div className={`flex items-center gap-[2px] ${className}`} style={{ height }} aria-hidden="true">
      {bars.map((v, i) => {
        const on = i / bars.length < progress;
        return (
          <span
            key={i}
            className="flex-1 rounded-full transition-colors duration-150"
            style={{ height: `${Math.max(12, v)}%`, backgroundColor: on ? "var(--accent)" : "rgba(27,42,74,0.18)", minWidth: 2 }}
          />
        );
      })}
    </div>
  );
}

/** Live bars that dance to the microphone while recording. */
export function LiveWave({ analyserRef, height = 56 }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    canvas.width = w * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    const count = 36;
    const levels = new Array(count).fill(0.08);
    const data = new Uint8Array(128);
    let raf = 0;
    function draw() {
      const analyser = analyserRef.current;
      if (analyser) {
        analyser.getByteFrequencyData(data);
        for (let i = 0; i < count; i++) {
          const v = data[Math.floor((i / count) * 70) + 2] / 255;
          levels[i] += (Math.max(0.08, v) - levels[i]) * 0.35;
        }
      } else {
        for (let i = 0; i < count; i++) levels[i] = 0.1 + 0.08 * Math.sin(Date.now() / 220 + i);
      }
      ctx.clearRect(0, 0, w, height);
      const gap = 3;
      const bw = (w - gap * (count - 1)) / count;
      ctx.fillStyle = "#D0584B";
      for (let i = 0; i < count; i++) {
        const h = Math.max(4, levels[i] * height);
        const x = i * (bw + gap);
        ctx.beginPath();
        ctx.roundRect(x, (height - h) / 2, bw, h, bw / 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, [analyserRef, height]);
  return <canvas ref={ref} className="w-full" style={{ height }} aria-hidden="true" />;
}
