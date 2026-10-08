import { useCallback, useEffect, useRef, useState } from "react";
import { adminListSellers, adminListBuyers, adminListMediators } from "./api";

/**
 * Loads all three CRM lists once (in parallel) so the Overview, Today and
 * Matches views share one fetch instead of each asking Google Sheets again.
 * Refreshes quietly every 2 minutes while the tab is visible.
 */
export default function useAllLeads(password) {
  const [data, setData] = useState({ seller: null, buyer: null, mediator: null });
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (!password || busy.current) return;
    busy.current = true;
    setRefreshing(true);
    try {
      const [s, b, m] = await Promise.allSettled([
        adminListSellers(password),
        adminListBuyers(password),
        adminListMediators(password),
      ]);
      const failed = [s, b, m].find((r) => r.status === "rejected");
      setData((prev) => ({
        seller: s.status === "fulfilled" ? s.value : prev.seller || [],
        buyer: b.status === "fulfilled" ? b.value : prev.buyer || [],
        mediator: m.status === "fulfilled" ? m.value : prev.mediator || [],
      }));
      setError(failed ? failed.reason?.message || "Couldn't load some data" : "");
      setUpdatedAt(new Date());
    } finally {
      busy.current = false;
      setRefreshing(false);
    }
  }, [password]);

  useEffect(() => {
    refresh();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 120000);
    return () => clearInterval(id);
  }, [refresh]);

  const loading = data.seller === null || data.buyer === null || data.mediator === null;
  return { data, loading, error, refresh, refreshing, updatedAt };
}
