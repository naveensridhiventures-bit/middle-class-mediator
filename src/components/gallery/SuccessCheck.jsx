import Burst from "./Burst";

/** A ring that draws itself, then a tick, with a confetti burst. */
export default function SuccessCheck({ size = 76 }) {
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 52 52" className="success-pop w-full h-full" aria-hidden="true">
        <circle cx="26" cy="26" r="24" fill="#1F7352" opacity="0.12" />
        <circle className="success-ring" cx="26" cy="26" r="23" fill="none" stroke="#1F7352" strokeWidth="3" strokeLinecap="round" />
        <path className="success-tick" d="M15 27.5l7.5 7.5L37.5 19" fill="none" stroke="#1F7352" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <Burst fire={1} count={22} spread={86} big />
    </span>
  );
}
