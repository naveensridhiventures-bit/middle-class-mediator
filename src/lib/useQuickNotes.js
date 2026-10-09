import { useCallback, useEffect, useRef, useState } from "react";
import { getAllNotes, getNote, putNote, removeNote, newId, keepStorage } from "./quickStore";
import { pushChanges, pullRemote } from "./quickSync";
import { adminQuickVersion } from "./api";

/**
 * All the state for the call-notes page. Notes are read from the phone first
 * (instant), changes are saved on the phone first (instant), and a background
 * sync keeps the sheet up to date whenever there's signal and a password.
 */
export default function useQuickNotes(password) {
  const [notes, setNotes] = useState([]);
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState("idle"); // idle | syncing | offline | auth
  const [lastSync, setLastSync] = useState(0);
  const busy = useRef(false);
  const passRef = useRef(password);
  useEffect(() => {
    passRef.current = password;
  }, [password]);

  const reload = useCallback(async () => {
    const all = await getAllNotes();
    setNotes(all.filter((n) => n.op !== "delete"));
    setReady(true);
  }, []);

  const again = useRef(null); // a sync was asked for while one was running
  const runSync = useCallback(async (opts = {}) => {
    const pw = passRef.current;
    if (!pw) {
      setSync("auth");
      return;
    }
    if (busy.current) {
      // don't wait for the slow sheet read: run again straight after this one
      again.current = { ...(again.current || {}), ...opts, pull: !!(again.current?.pull || opts.pull) };
      return;
    }
    busy.current = true;
    setSync("syncing");
    try {
      const push = await pushChanges(pw);
      if (push.error) {
        setSync(push.error === "auth" ? "auth" : "offline");
        return;
      }
      if (opts.pushOnly) {
        setSync("idle");
        return;
      }
      const pull = await pullRemote(pw);
      if (pull.error) {
        setSync(pull.error === "auth" ? "auth" : "offline");
        return;
      }
      setSync("idle");
      setLastSync(Date.now());
    } finally {
      busy.current = false;
      await reload();
      const next = again.current;
      again.current = null;
      if (next) runSync({ pushOnly: !next.pull });
    }
  }, [reload]);

  useEffect(() => {
    keepStorage();
    reload();
  }, [reload]);

  // Sync on open, when the password arrives, when signal returns, when the tab
  // comes back to the front, and every 30 seconds while it's open.
  useEffect(() => {
    runSync();
    const tick = setInterval(() => runSync(), 30000);
    const onOnline = () => runSync();
    const onVisible = () => document.visibilityState === "visible" && runSync();
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(tick);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [runSync, password]);

  // Watch for notes saved on another logged-in phone/computer: a tiny check
  // every 3 seconds while this page is visible; the full list is only fetched
  // when something actually changed.
  const seenVersion = useRef(null);
  useEffect(() => {
    if (!password) return undefined;
    let stop = false;
    let running = false;
    async function check() {
      if (stop || running || document.visibilityState !== "visible" || busy.current) return;
      running = true;
      try {
        const { v } = await adminQuickVersion(password);
        if (seenVersion.current !== null && v !== seenVersion.current) runSync({ pull: true });
        seenVersion.current = v;
      } catch {
        // offline or wrong password: the normal sync reports it
      } finally {
        running = false;
      }
    }
    const t = setInterval(check, 3000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [password, runSync]);

  const addNote = useCallback(
    async ({ name, phone, note, audio }) => {
      const n = {
        id: newId(), createdAt: Date.now(), name: name.trim(), phone, note: note.trim(),
        durationSec: audio?.durationSec || 0, peaks: audio?.peaks || [], mime: audio?.mime || "",
        blob: audio?.blob || null, hasAudio: !!audio?.blob, status: "new", op: "create", remoteId: "", played: true,
      };
      // show it at once; the phone's storage and the upload catch up behind it
      setNotes((cur) => [n, ...cur]);
      putNote(n).then(() => runSync({ pushOnly: true }));
      return n;
    },
    [runSync]
  );

  const patchNote = useCallback(
    async (id, patch) => {
      setNotes((list) => list.map((x) => (x.id === id ? { ...x, ...patch, op: x.op === "create" ? "create" : "update" } : x)));
      const cur = await getNote(id);
      if (!cur || cur.op === "delete") return;
      await putNote({ ...cur, ...patch, op: cur.op === "create" ? "create" : "update" });
      runSync({ pushOnly: true });
    },
    [runSync]
  );

  // "played" is only a local marker, so it never needs to reach the sheet.
  const markPlayed = useCallback(
    async (id) => {
      const cur = await getNote(id);
      if (cur && !cur.played) {
        await putNote({ ...cur, played: true });
        await reload();
      }
    },
    [reload]
  );

  const deleteNote = useCallback(
    async (id) => {
      setNotes((list) => list.filter((x) => x.id !== id));
      const cur = await getNote(id);
      if (!cur) return;
      if (!cur.remoteId && cur.op !== "create") {
        await removeNote(id);
      } else if (!cur.remoteId) {
        // never reached the sheet: gone straight away (a late upload cleans itself up)
        await removeNote(id);
      } else {
        await putNote({ ...cur, op: "delete" });
      }
      runSync({ pushOnly: true });
    },
    [runSync]
  );

  return { notes, ready, sync, lastSync, addNote, patchNote, markPlayed, deleteNote, runSync, reload };
}
