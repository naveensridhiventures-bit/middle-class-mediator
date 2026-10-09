// Local, on-device storage for quick call notes (IndexedDB, with an in-memory
// fallback if the browser blocks it). Saving here is instant and never needs
// the network, so a note is never lost mid-call.
//
// A note: { id, createdAt, name, phone, note, durationSec, peaks:[0-99 x40],
//           mime, blob|null, hasAudio, status:"new"|"done",
//           op:"create"|"update"|"delete"|null, remoteId, played }

const DB = "mcm_quick_v1";
const STORE = "notes";
const mem = new Map();
let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function run(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const req = fn(store);
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export async function getAllNotes() {
  const db = await openDb();
  const list = db ? await run(db, "readonly", (s) => s.getAll()) : [...mem.values()];
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getNote(id) {
  const db = await openDb();
  return db ? run(db, "readonly", (s) => s.get(id)) : mem.get(id);
}

export async function putNote(note) {
  const db = await openDb();
  if (!db) {
    mem.set(note.id, note);
    return;
  }
  await run(db, "readwrite", (s) => s.put(note));
}

export async function removeNote(id) {
  const db = await openDb();
  if (!db) {
    mem.delete(id);
    return;
  }
  await run(db, "readwrite", (s) => s.delete(id));
}

/** Ask the browser not to clear our recordings when the phone is low on space. */
export function keepStorage() {
  try {
    navigator.storage?.persist?.();
  } catch {
    // not supported: fine
  }
}

export const newId = () => `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export function base64ToBlob(b64, mime) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime || "audio/webm" });
}

/** 9876543210 → 98765 43210 */
export const fmtPhone = (p) => (p && p.length === 10 ? `${p.slice(0, 5)} ${p.slice(5)}` : p || "");
