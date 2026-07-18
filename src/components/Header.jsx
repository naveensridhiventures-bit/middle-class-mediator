import { Link, useLocation } from "react-router-dom";
import { APP_NAME } from "../lib/config";

export default function Header() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-paper/85 border-b border-ink/10">
      <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="w-9 h-9 rounded-full border-2 border-ink flex items-center justify-center font-display font-bold text-ink text-sm group-hover:bg-ink group-hover:text-paper transition">
            MCM
          </span>
          <span className="font-display font-semibold text-lg tracking-tight text-ink hidden sm:block">
            {APP_NAME}
          </span>
        </Link>
        {pathname !== "/" && (
          <Link
            to="/"
            className="text-xs uppercase tracking-wider font-semibold text-ink/60 hover:text-ink transition"
          >
            ← All roles
          </Link>
        )}
      </div>
    </header>
  );
}
