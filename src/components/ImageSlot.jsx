import { useState } from "react";

/**
 * Tries to load a real photo from /public/images/<src>. If it's missing
 * (you haven't dropped a photo in yet), falls back to a tasteful gradient +
 * icon panel so the page still looks complete. Drop a JPG/PNG at
 * public/images/<src> to replace the placeholder with a real photo.
 */
export default function ImageSlot({ src, alt, icon: Icon, gradient, className = "" }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ background: gradient }}
      >
        {Icon && <Icon size={32} className="text-white/70" strokeWidth={1.5} />}
      </div>
    );
  }

  return (
    <img
      src={`/images/${src}`}
      alt={alt}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
