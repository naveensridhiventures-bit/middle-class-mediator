import { useCallback, useEffect, useRef, useState } from "react";
import { getAllNotes, getNote, putNote, removeNote, newId, keepStorage } from "./quickStore";
import { pushChanges, pullRemote } from "./quickSync";

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

  const runSync = useCallback(async () => {
    const pw = passRef.current;
    if (!pw) {
      setSync("auth");
      return;
    }
    if (busy.current) return;
    busy.current = true;
    setSync("syncing");
    try {
      const push = await pushChanges(pw);
      if (push.error) {
        setSync(push.error === "auth" ? "auth" : "offline");
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
    const tick = setInterval(runSync, 30000);
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

  const addNote = useCallback(
    async ({ name, phone, note, audio }) => {
      const n = {
        id: newId(), createdAt: Date.now(), name: name.trim(), phone, note: note.trim(),
        durationSec: audio?.durationSec || 0, peaks: audio?.peaks || [], mime: audio?.mime || "",
        blob: audio?.blob || null, hasAudio: !!audio?.blob, status: "new", op: "create", remoteId: "", played: true,
      };
      await putNote(n);
      await reload();
      runSync();
      return n;
    },
    [reload, runSync]
  );

  const patchNote = useCallback(
    async (id, patch) => {
      const cur = await getNote(id);
      if (!cur || cur.op === "delete") return;
      await putNote({ ...cur, ...patch, op: cur.op === "create" ? "create" : "update" });
      await reload();
      runSync();
    },
    [reload, runSync]
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
      await reload();
      runSync();
    },
    [reload, runSync]
  );

  return { notes, ready, sync, lastSync, addNote, patchNote, markPlayed, deleteNote, runSync, reload };
}
