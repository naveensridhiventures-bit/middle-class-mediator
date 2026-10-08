// Touch / click ripple for any element with the `rip` class (needs relative + overflow-hidden).
export function installRipple() {
  if (typeof document === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  document.addEventListener(
    "pointerdown",
    (e) => {
      const host = e.target.closest?.(".rip");
      if (!host || host.disabled) return;
      const r = host.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2.2;
      const wave = document.createElement("span");
      wave.className = "rip-wave";
      wave.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      host.appendChild(wave);
      setTimeout(() => wave.remove(), 700);
    },
    { passive: true }
  );
}
