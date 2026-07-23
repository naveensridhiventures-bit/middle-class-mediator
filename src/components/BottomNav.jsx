import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, LayoutGrid, Plus, Heart, User, Handshake, HomeIcon, Search } from "lucide-react";

export default function BottomNav() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toast, setToast] = useState("");
  const navigate = useNavigate();

  function showComingSoon(label) {
    setToast(`${label} — coming soon`);
    setTimeout(() => setToast(""), 1800);
  }

  function goTo(path) {
    setPickerOpen(false);
    navigate(path);
  }

  return (
    <>
      {pickerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-ink/30"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="absolute bottom-20 left-4 right-4 card-ledger p-3 flex gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => goTo("/mediator")} className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl hover:bg-mediator/5">
              <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#2D437320", color: "#2D4373" }}>
                <Handshake size={16} />
              </span>
              <span className="text-xs font-semibold text-ink/70">Mediator</span>
            </button>
            <button onClick={() => goTo("/seller")} className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl hover:bg-seller/5">
              <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1F6F5C20", color: "#1F6F5C" }}>
                <HomeIcon size={16} />
              </span>
              <span className="text-xs font-semibold text-ink/70">Seller</span>
            </button>
            <button onClick={() => goTo("/buyer")} className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl hover:bg-buyer/5">
              <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#B5533C20", color: "#B5533C" }}>
                <Search size={16} />
              </span>
              <span className="text-xs font-semibold text-ink/70">Buyer</span>
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-ink text-paper text-xs font-semibold px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-paper/95 backdrop-blur border-t border-ink/10 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Link to="/" className="flex flex-col items-center gap-1 px-3 py-1 text-ink">
            <Home size={20} />
            <span className="text-[10px] font-semibold">Home</span>
          </Link>
          <a href="/#categories" className="flex flex-col items-center gap-1 px-3 py-1 text-ink/50">
            <LayoutGrid size={20} />
            <span className="text-[10px] font-semibold">Categories</span>
          </a>
          <button
            onClick={() => setPickerOpen((v) => !v)}
            aria-label="Post property"
            className="w-12 h-12 -mt-6 rounded-full bg-buyer text-white flex items-center justify-center shadow-lg shadow-buyer/30 active:scale-95 transition"
          >
            <Plus size={22} />
          </button>
          <button onClick={() => showComingSoon("Saved")} className="flex flex-col items-center gap-1 px-3 py-1 text-ink/50">
            <Heart size={20} />
            <span className="text-[10px] font-semibold">Saved</span>
          </button>
          <button onClick={() => showComingSoon("Profile")} className="flex flex-col items-center gap-1 px-3 py-1 text-ink/50">
            <User size={20} />
            <span className="text-[10px] font-semibold">Profile</span>
          </button>
        </div>
      </nav>
    </>
  );
}
