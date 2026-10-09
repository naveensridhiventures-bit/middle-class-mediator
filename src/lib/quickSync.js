import { adminAttachQuickAudio, adminAddQuickNote, adminListQuickNotes, adminUpdateQuickNote, adminDeleteQuickNote, adminGetQuickAudio } from "./api";
import { getAllNotes, getNote, putNote, removeNote, blobToBase64, base64ToBlob } from "./quickStore";

const isAuthError = (e) => /wrong password/i.test(e?.message || "");

/** Sends every waiting change to the sheet, oldest first. Stops at the first network problem. */
export async function pushChanges(password) {
  const list = (await getAllNotes()).filter((n) => n.op || n.audioPending).sort((a, b) => a.createdAt - b.createdAt);
  let pushed = 0;
  for (const n of list) {
    try {
      if (!n.op && n.audioPending) {
        // the number and name are already saved: finish attaching the recording
        if (n.blob && n.remoteId) await adminAttachQuickAudio(password, n.remoteId, { phone: n.phone, audioMime: n.mime || "", audioBase64: await blobToBase64(n.blob) });
        const cur = await getNote(n.id);
        if (cur) await putNote({ ...cur, audioPending: false });
      } else if (n.op === "create") {
        const res = await adminAddQuickNote(password, {
          clientId: n.id,
          name: n.name,
          phone: n.phone,
          note: n.note,
          durationSec: n.durationSec || "",
          peaks: n.peaks?.length ? JSON.stringify(n.peaks) : "",
          audioMime: n.mime || "",
        });
        const cur = await getNote(n.id);
        if (!cur || cur.op === "delete") {
          // deleted while it was uploading: clean up the copy that just landed
          await adminDeleteQuickNote(password, res.id);
          await removeNote(n.id);
        } else {
          // keep any edits made during the upload (they become an update)
          const edited = cur.name !== n.name || cur.phone !== n.phone || cur.note !== n.note || cur.status !== n.status;
          await putNote({ ...cur, remoteId: res.id, op: edited ? "update" : null, audioPending: !!n.blob });
          // the row is on the sheet now (other phones can see the number and name); add the recording
          if (n.blob) {
            await adminAttachQuickAudio(password, res.id, { phone: n.phone, audioMime: n.mime || "", audioBase64: await blobToBase64(n.blob) });
            const after = await getNote(n.id);
            if (after) await putNote({ ...after, audioPending: false });
          }
        }
      } else if (n.op === "update") {
        if (n.remoteId) await adminUpdateQuickNote(password, n.remoteId, { name: n.name, phone: n.phone, note: n.note, status: n.status });
        const cur = await getNote(n.id);
        if (cur) await putNote({ ...cur, op: cur.op === "delete" ? "delete" : null });
      } else if (n.op === "delete") {
        if (n.remoteId) await adminDeleteQuickNote(password, n.remoteId);
        await removeNote(n.id);
      }
      pushed += 1;
    } catch (e) {
      return { pushed, error: isAuthError(e) ? "auth" : "network" };
    }
  }
  return { pushed, error: "" };
}

/** Brings in notes saved from another device and picks up status changes made there. */
export async function pullRemote(password) {
  let rows;
  try {
    rows = await adminListQuickNotes(password);
  } catch (e) {
    return { error: isAuthError(e) ? "auth" : "network" };
  }
  const local = await getAllNotes();
  const byId = new Map(local.map((n) => [n.id, n]));
  const remoteIds = new Set();
  for (const r of rows) {
    const id = r.clientId || r.id;
    remoteIds.add(id);
    const mine = byId.get(id);
    let peaks = [];
    try {
      peaks = r.peaks ? JSON.parse(r.peaks) : [];
    } catch {
      peaks = [];
    }
    const fields = { name: String(r.name || ""), phone: String(r.phone || ""), note: String(r.note || ""), status: r.status === "done" ? "done" : "new" };
    if (!mine) {
      await putNote({
        id, createdAt: Date.parse(r.timestamp) || Date.now(), ...fields,
        durationSec: Number(r.durationSec) || 0, peaks, mime: r.audioMime || "", blob: null,
        hasAudio: !!r.audioFileId, op: null, remoteId: r.id, played: false,
      });
    } else if (!mine.op) {
      await putNote({ ...mine, ...fields, remoteId: r.id, hasAudio: mine.hasAudio || !!r.audioFileId });
    }
  }
  // notes deleted from another device
  for (const n of local) {
    if (n.remoteId && !n.op && !remoteIds.has(n.id)) await removeNote(n.id);
  }
  return { error: "" };
}

/** Downloads a recording that was saved on another device, and keeps it for next time. */
export async function fetchAudio(password, note) {
  if (note.blob) return note.blob;
  const res = await adminGetQuickAudio(password, note.remoteId);
  const blob = base64ToBlob(res.base64, res.mime);
  const cur = await getNote(note.id);
  if (cur) await putNote({ ...cur, blob, mime: res.mime });
  return blob;
}
