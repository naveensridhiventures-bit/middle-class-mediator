import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Small "back to home" link shown at the top of the Seller / Buyer /
 * Mediator registration pages. Previously these pages had no way back to
 * the role-picker except the browser's back button.
 */
export default function BackHome({ color = "#1B2A4A" }) {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide opacity-60 hover:opacity-100 transition mb-2"
      style={{ color }}
    >
      <ArrowLeft size={13} />
      Home
    </Link>
  );
}
