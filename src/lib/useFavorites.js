import { useCallback, useEffect, useState } from "react";

const KEY = "mcm_favorites_v1";

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saved listings ("hearts"), kept on this phone only. No account needed.
 * Storage can be unavailable (private mode), so every access is guarded and
 * the hearts still work for the current visit.
 */
export default function useFavorites() {
  const [ids, setIds] = useState(read);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      // storage unavailable: hearts last for this visit only
    }
  }, [ids]);

  // Keep several open tabs in step.
  useEffect(() => {
    function onStorage(e) {
      if (e.key === KEY) setIds(read());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback((id) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const has = useCallback((id) => ids.includes(id), [ids]);

  return { ids, has, toggle };
}
