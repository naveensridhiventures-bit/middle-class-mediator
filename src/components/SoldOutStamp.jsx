/**
 * Shared "SOLD OUT" corner ribbon — used on both the public gallery cards
 * and the admin CRM lead cards, so they look identical. A diagonal banner
 * across the top-right corner, like a classic e-commerce sale tag, with a
 * stitched-edge look and drop shadow for a more premium feel than a plain
 * centered stamp.
 */
export default function SoldOutStamp({ size = "lg" }) {
  const sizes = {
    sm: { box: "w-24 h-24", text: "text-[10px] py-1", top: "top-[20%]" },
    lg: { box: "w-36 h-36 sm:w-44 sm:h-44", text: "text-xs sm:text-sm py-1.5 sm:py-2", top: "top-[22%]" },
  };
  const s = sizes[size] || sizes.lg;

  return (
    <div className={`absolute top-0 right-0 z-10 overflow-hidden pointer-events-none ${s.box}`}>
      <div
        className={`absolute right-[-30%] w-[170%] text-center font-display font-extrabold text-white uppercase tracking-[0.2em] ${s.text} ${s.top}`}
        style={{
          transform: "rotate(45deg)",
          background: "linear-gradient(135deg, #D2543F, #7A2418)",
          boxShadow: "0 6px 16px -2px rgba(0,0,0,0.5)",
          borderTop: "1px dashed rgba(255,255,255,0.55)",
          borderBottom: "1px dashed rgba(255,255,255,0.55)",
        }}
      >
        Sold Out
      </div>
    </div>
  );
}
