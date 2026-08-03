/**
 * Shared "SOLD OUT" stamp overlay — used on both the public gallery cards
 * and the admin CRM lead cards, so they look identical. Sized responsively
 * so it stays proportional to its container rather than a fixed pixel size.
 */
export default function SoldOutStamp({ size = "lg" }) {
  const sizes = {
    sm: {
      text: "text-base sm:text-lg",
      pad: "px-6 py-2",
      border: "border-[3px]",
      tracking: "tracking-[0.2em]",
    },
    lg: {
      text: "text-2xl sm:text-3xl",
      pad: "px-10 sm:px-14 py-3 sm:py-3.5",
      border: "border-4",
      tracking: "tracking-[0.3em]",
    },
  };
  const s = sizes[size] || sizes.lg;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-ink/10" />
      <span
        className={`relative font-display font-extrabold text-white uppercase ${s.text} ${s.pad} ${s.border} ${s.tracking} border-white/90`}
        style={{
          transform: "rotate(-11deg)",
          background: "linear-gradient(135deg, #C24A38, #7A2418)",
          boxShadow: "0 10px 30px -6px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.15)",
        }}
      >
        Sold Out
      </span>
    </div>
  );
}
