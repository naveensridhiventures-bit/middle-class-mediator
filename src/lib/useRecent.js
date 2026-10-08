import { useCallback, useState } from "react";

const KEY = "mcm_recent_v1";
const MAX = 8;

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** The listings this visitor opened most recently (kept on this device only). */
export default function useRecent() {
  const [ids, setIds] = useState(read);

  const record = useCallback((id) => {
    if (!id) return;
    const next = [id, ...read().filter((x) => x !== id)].slice(0, MAX);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // storage unavailable: recent list lasts for this visit only
    }
    setIds(next);
  }, []);

  return { ids, record };
}
