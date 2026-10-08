import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Bottom sheet on phones, centred panel on larger screens. Esc / backdrop closes. */
export default function Sheet({ title, subtitle, onClose, children, wide = false }) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    const body = document.body;
    const prev = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      body.style.overflow = prev;
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 bg-ink-dark/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center mcm-fade" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-surface w-full ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"} max-h-[92dvh] rounded-t-[1.75rem] sm:rounded-[1.75rem] shadow-2xl flex flex-col sheet-pop`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0">
            <h2 className="font-display font-bold text-[1.3rem] text-ink leading-tight">{title}</h2>
            {subtitle && <p className="text-[13px] text-ink/55 mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-10 h-10 shrink-0 rounded-full hover:bg-ink/5 flex items-center justify-center">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
