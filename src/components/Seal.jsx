// The recurring "notary stamp" signature element — used on role cards,
// listing cards ("verified"), and section dividers to carry the
// ledger / brokerage-document motif through the app.
export default function Seal({ label, color = "#1B2A4A", size = 88, rotate = -8 }) {
  const id = `seal-${label?.replace(/\s+/g, "-").toLowerCase() || "mark"}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      <defs>
        <path id={id} d="M 50 50 m -38 0 a 38 38 0 1 1 76 0 a 38 38 0 1 1 -76 0" />
      </defs>
      <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="2 3" opacity="0.6" />
      <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="2.5" />
      <circle cx="50" cy="50" r="4" fill={color} />
      <text fill={color} fontSize="9.5" fontWeight="600" letterSpacing="2">
        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
          {label?.toUpperCase()}
        </textPath>
      </text>
    </svg>
  );
}
