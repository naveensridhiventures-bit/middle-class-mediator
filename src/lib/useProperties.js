import { useEffect, useMemo, useState } from "react";
import { listPublicProperties } from "./api";
import { normalize } from "./gallery";

const CACHE_KEY = "mcm_gallery_cache_v2";

function readCache() {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

/**
 * Loads the public listings for every gallery page. A copy is kept for the
 * visit, so opening a listing from the gallery (or going back) is instant,
 * while a fresh copy is always fetched in the background.
 * Returns { properties: [...] | null, error }
 */
export default function useProperties() {
  const [raw, setRaw] = useState(readCache);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    listPublicProperties()
      .then((data) => {
        if (!alive) return;
        const list = [...data].reverse(); // newest first
        setRaw(list);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(list));
        } catch {
          // storage full or unavailable: the page still works
        }
      })
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, []);

  const properties = useMemo(() => (raw ? raw.map(normalize) : null), [raw]);
  return { properties, error: properties ? "" : error };
}
