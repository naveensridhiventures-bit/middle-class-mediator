/**
 * MIDDLE CLASS MEDIATOR — Google Sheets backend
 * ------------------------------------------------
 * Paste this whole file into Extensions > Apps Script of your Google Sheet,
 * then deploy as a Web App (see README.md for the full walkthrough).
 *
 * Sheet tabs used (created automatically the first time they're needed):
 *   Mediators, Sellers, Buyers, Properties, QuickNotes, Broadcasts, BroadcastItems
 *
 * NOTE ON UPGRADES: if you already had this sheet running before priority /
 * follow-up / remarks-history existed, you don't need to do anything special —
 * the first time each sheet is written to after you redeploy this file,
 * prepareSheet() below will automatically add any missing columns to the end
 * of that sheet's header row without touching your existing data.
 *
 * PERFORMANCE NOTE: only actions that write to a sheet take the script lock
 * and pay the cost of checking/migrating columns. Read-only actions (the
 * "list..." actions and admin login) skip both, since they can safely run
 * concurrently and don't need column migration — this is what makes loading
 * the CRM and logging in noticeably faster than earlier versions.
 */

const SHEETS = {
  Mediators: ["id", "timestamp", "name", "phone", "profession", "workingArea", "propertyCategory", "experience", "dealType", "genuineLeads", "status", "status2", "priority", "followUpDate", "area", "customFields", "remarksLog"],
  Sellers: ["id", "timestamp", "name", "phone", "propertyType", "propertyLocation", "propertyStatus", "expectedPrice", "exactPrice", "ownership", "purpose", "propertyAge", "buildingType", "landArea", "builtUpArea", "frontageLength", "frontageBreadth", "roadWidth", "facing", "propertyUsage", "pattaApproval", "approvalStatus", "parking", "rentalStatus", "loanStatus", "photosShared", "sellerRemarks", "listingTitle", "timeline", "status", "priority", "followUpDate", "area", "budgetValue", "sqft", "customFields", "galleryFields", "photos", "exactAddress", "mapLink", "visitLog", "remarksLog"],
  Buyers: ["id", "timestamp", "name", "phone", "propertyType", "purpose", "budget", "preferredLocation", "loanRequirement", "timeline", "status", "priority", "followUpDate", "area", "budgetValue", "sqft", "customFields", "remarksLog"],
  QuickNotes: ["id", "timestamp", "clientId", "name", "phone", "note", "audioFileId", "audioMime", "durationSec", "peaks", "status"],
  // PC-agent broadcast queue: one row per broadcast, one row per recipient.
  Broadcasts: ["id", "timestamp", "name", "message", "audience", "total", "sent", "failed", "status", "claimedBy", "updatedAt"],
  BroadcastItems: ["id", "jobId", "idx", "role", "leadId", "name", "phone", "text", "status", "error", "updatedAt"],
  Properties: ["id", "timestamp", "title", "type", "location", "price", "sqft", "description", "imageUrl", "images", "attributes", "sellerNote", "contactPhone", "refId", "soldOut"],
};

// Actions in this set take the script lock and go through column
// migration (prepareSheet). Everything else is treated as read-only and
// skips both for speed.
const WRITE_ACTIONS = {
  addMediator: true, addSeller: true, addBuyer: true,
  updateLead: true, addRemark: true, addVisit: true, deleteLead: true,
  addProperty: true, updateProperty: true, deleteProperty: true,
  addQuickNote: true, attachQuickAudio: true, updateQuickNote: true, deleteQuickNote: true,
  queueBroadcast: true, cancelBroadcast: true, agentReport: true, agentPoll: true,
};

function doGet() {
  return jsonResponse({ ok: true, data: "Middle Class Mediator API is running." });
}

function doPost(e) {
  var req = JSON.parse(e.postData.contents);
  var action = req.action;
  var p = req.payload || {};

  var isWrite = !!WRITE_ACTIONS[action];
  var lock = null;
  if (isWrite) {
    lock = LockService.getScriptLock();
    lock.waitLock(10000);
  }

  try {
    var result = route(action, p);
    return jsonResponse({ ok: true, data: result });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err.message || err) });
  } finally {
    if (lock) lock.releaseLock();
  }
}

function route(action, p) {
  switch (action) {
    case "addMediator":
      return addRow("Mediators", {
        name: p.name, phone: p.phone, profession: p.profession, workingArea: p.workingArea,
        propertyCategory: p.propertyCategory, experience: p.experience, dealType: p.dealType,
        genuineLeads: p.genuineLeads, status: "New", priority: 3, followUpDate: "", customFields: "{}", remarksLog: "[]",
      });

    case "addSeller":
      return addRow("Sellers", {
        name: p.name, phone: p.phone, propertyType: p.propertyType, propertyLocation: p.propertyLocation,
        propertyStatus: p.propertyStatus, expectedPrice: p.expectedPrice, exactPrice: p.exactPrice, ownership: p.ownership,
        purpose: p.purpose, propertyAge: p.propertyAge, buildingType: p.buildingType,
        landArea: p.landArea, builtUpArea: p.builtUpArea, frontageLength: p.frontageLength, frontageBreadth: p.frontageBreadth,
        roadWidth: p.roadWidth, facing: p.facing, propertyUsage: p.propertyUsage, pattaApproval: p.pattaApproval,
        approvalStatus: p.approvalStatus, parking: p.parking, rentalStatus: p.rentalStatus, loanStatus: p.loanStatus,
        photosShared: p.photosShared, sellerRemarks: p.sellerRemarks,
        timeline: p.timeline, status: "New", priority: 3, followUpDate: "", customFields: "{}", galleryFields: "[]", photos: "[]", visitLog: "[]", remarksLog: "[]",
      });

    case "addBuyer":
      return addRow("Buyers", {
        name: p.name, phone: p.phone, propertyType: p.propertyType, purpose: p.purpose,
        budget: p.budget, preferredLocation: p.preferredLocation, loanRequirement: p.loanRequirement,
        timeline: p.timeline, status: "New", priority: 3, followUpDate: "", customFields: "{}", remarksLog: "[]",
      });

    case "listProperties":
      return readSheet("Properties");

    case "adminLogin":
      checkPassword(p.password);
      return true;

    case "listMediators":
      checkPassword(p.password);
      return readSheet("Mediators");

    case "listSellers":
      checkPassword(p.password);
      return readSheet("Sellers");

    case "listBuyers":
      checkPassword(p.password);
      return readSheet("Buyers");

    // Updates any editable field on a lead — original submitted details
    // (name, phone, property type, etc.), status, priority, follow-up
    // date, and the admin-set area/budget/size metadata. Never touches
    // id, timestamp, or remarksLog (use "addRemark" for that so history
    // is additive and never overwritten).
    case "updateLead":
      checkPassword(p.password);
      return updateRow(p.sheet, p.id, sanitizePatch(p.patch));

    // Appends a single dated remark to the lead's remarksLog (stored as a
    // JSON array in one cell) instead of overwriting previous notes.
    case "addRemark":
      checkPassword(p.password);
      return appendRemark(p.sheet, p.id, p.text, p.by);

    // Permanently deletes a lead row from any of the three lead sheets.
    case "deleteLead":
      checkPassword(p.password);
      return deleteRow(p.sheet, p.id);

    // Appends a dated site-visit entry (photo URL, GPS coords, reverse-
    // geocoded address) to a seller lead's visitLog. Additive only —
    // never overwrites previous visits.
    case "addVisit":
      checkPassword(p.password);
      return appendVisit(p.sheet, p.id, {
        photoUrl: p.photoUrl, lat: p.lat, lng: p.lng, address: p.address, by: p.by,
      });

      case "addProperty":
        checkPassword(p.password);
        return addRow("Properties", {
          title: p.title, type: p.type, location: p.location, price: p.price, sqft: p.sqft,
          description: p.description, imageUrl: p.imageUrl, images: p.images, attributes: p.attributes, sellerNote: p.sellerNote, contactPhone: p.contactPhone, refId: p.refId, soldOut: p.soldOut,
        });

      case "updateProperty":
        checkPassword(p.password);
        return updateRow("Properties", p.id, {
          title: p.title, type: p.type, location: p.location, price: p.price, sqft: p.sqft,
          description: p.description, imageUrl: p.imageUrl, images: p.images, attributes: p.attributes, sellerNote: p.sellerNote, contactPhone: p.contactPhone, refId: p.refId, soldOut: p.soldOut,
        });

    case "deleteProperty":
      checkPassword(p.password);
      return deleteRow("Properties", p.id);

    // ---- Quick call notes (voice + number + name saved right after a call) ----
    case "addQuickNote":
      checkPassword(p.password);
      return addQuickNote(p);

    case "quickVersion":
      checkPassword(p.password);
      return { v: PropertiesService.getScriptProperties().getProperty("QUICK_V") || "0" };

    case "attachQuickAudio":
      checkPassword(p.password);
      return attachQuickAudio(p);

    case "listQuickNotes":
      checkPassword(p.password);
      return readSheet("QuickNotes");

    case "getQuickAudio":
      checkPassword(p.password);
      return getQuickAudio(p.id);

    case "updateQuickNote":
      checkPassword(p.password);
      var upd = updateRow("QuickNotes", p.id, quickPatch(p.patch));
      bumpQuickVersion();
      return upd;

    case "deleteQuickNote":
      checkPassword(p.password);
      var del = deleteQuickNote(p.id);
      bumpQuickVersion();
      return del;

    // ---- Broadcast queue: admin queues, the PC console (agent) sends ----
    case "queueBroadcast":
      checkPassword(p.password);
      return queueBroadcast(p);

    case "listBroadcasts":
      checkPassword(p.password);
      return listBroadcasts();

    case "getBroadcast":
      checkPassword(p.password);
      return getBroadcast(p.id);

    case "cancelBroadcast":
      checkPassword(p.password);
      return cancelBroadcast(p.id);

    case "agentPoll":
      checkAgent(p);
      return agentPoll(p);

    case "agentReport":
      checkAgent(p);
      return agentReport(p);

    default:
      throw new Error("Unknown action: " + action);
  }
}

// ---------- helpers ----------

function getHeaders(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
}

// Fetches a sheet WITHOUT checking/migrating columns — for read paths,
// where a slightly-out-of-date header row is fine (a missing column just
// reads as undefined) and the extra round trip isn't worth paying for on
// every single list request. Only creates the sheet if it's genuinely
// missing (rare after first run), in which case it defers to prepareSheet.
function getSheetFast(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) return prepareSheet(name).sheet;
  return sheet;
}

// Fetches a sheet AND makes sure every column this app now expects exists,
// adding any missing ones to the end of the header row in a single write.
// Returns both the sheet and its up-to-date header row so callers don't
// need to re-read headers immediately afterward. Used only by write paths.
function prepareSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  var required = SHEETS[name] || [];

  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(required);
    sheet.setFrozenRows(1);
    return { sheet: sheet, headers: required.slice() };
  }

  var headers = getHeaders(sheet);
  var missing = required.filter(function (h) {
    return headers.indexOf(h) === -1;
  });
  if (missing.length > 0) {
    var startCol = headers.length + 1;
    sheet.getRange(1, startCol, 1, missing.length).setValues([missing]);
    headers = headers.concat(missing);
  }
  return { sheet: sheet, headers: headers };
}

// Back-compat alias used by setup().
function getSheet(name) {
  return prepareSheet(name).sheet;
}

function addRow(sheetName, data) {
  var prepared = prepareSheet(sheetName);
  var id = sheetName.substring(0, 3).toUpperCase() + "-" + Utilities.getUuid().slice(0, 6).toUpperCase();
  var row = prepared.headers.map(function (h) {
    if (h === "id") return id;
    if (h === "timestamp") return new Date().toISOString();
    if (h === "remarksLog" && data[h] === undefined) return "[]";
    return data[h] !== undefined ? data[h] : "";
  });
  prepared.sheet.appendRow(row);
  return { id: id };
}

function readSheet(sheetName) {
  var sheet = getSheetFast(sheetName);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  return values.slice(1).map(function (row) {
    var obj = {};
    headers.forEach(function (h, i) {
      obj[h] = row[i];
    });
    return obj;
  }).filter(function (obj) {
    return obj.id; // skip blank trailing rows
  });
}

function findRowIndexById(sheet, id) {
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === id) return i + 1; // 1-indexed sheet row
  }
  return -1;
}

// Strips protected fields out of a patch object before it reaches
// updateRow, so the generic "updateLead" action can never clobber a
// record's id, timestamp, or remarks history.
function sanitizePatch(patch) {
  var clean = {};
  var protectedKeys = { id: true, timestamp: true, remarksLog: true };
  Object.keys(patch || {}).forEach(function (key) {
    if (!protectedKeys[key] && patch[key] !== undefined) {
      clean[key] = patch[key];
    }
  });
  return clean;
}

function updateRow(sheetName, id, patch) {
  var prepared = prepareSheet(sheetName);
  var rowIndex = findRowIndexById(prepared.sheet, id);
  if (rowIndex === -1) throw new Error("Record not found: " + id);
  Object.keys(patch).forEach(function (key) {
    var colIndex = prepared.headers.indexOf(key);
    if (colIndex !== -1 && patch[key] !== undefined) {
      prepared.sheet.getRange(rowIndex, colIndex + 1).setValue(patch[key]);
    }
  });
  return { id: id };
}

// Appends a dated site-visit entry to a lead's visitLog (JSON array in one
// cell) instead of overwriting previous visits.
function appendVisit(sheetName, id, visit) {
  var prepared = prepareSheet(sheetName);
  var rowIndex = findRowIndexById(prepared.sheet, id);
  if (rowIndex === -1) throw new Error("Record not found: " + id);
  var colIndex = prepared.headers.indexOf("visitLog");
  if (colIndex === -1) throw new Error("visitLog column missing — redeploy Code.gs and try again.");
  var cell = prepared.sheet.getRange(rowIndex, colIndex + 1);
  var existing = cell.getValue();
  var log = [];
  if (existing) {
    try {
      log = JSON.parse(existing);
      if (!Array.isArray(log)) log = [];
    } catch (e) {
      log = [];
    }
  }
  log.push({
    photoUrl: visit.photoUrl || "",
    lat: visit.lat || "",
    lng: visit.lng || "",
    address: visit.address || "",
    at: new Date().toISOString(),
    by: visit.by ? String(visit.by).trim() : "",
  });
  cell.setValue(JSON.stringify(log));
  return { id: id, visitLog: log };
}

// Appends a dated remark to a lead's remarksLog (JSON array in one cell)
// instead of overwriting previous notes.
function appendRemark(sheetName, id, text, by) {
  if (!text || !String(text).trim()) throw new Error("Remark text is required.");
  var prepared = prepareSheet(sheetName);
  var rowIndex = findRowIndexById(prepared.sheet, id);
  if (rowIndex === -1) throw new Error("Record not found: " + id);
  var colIndex = prepared.headers.indexOf("remarksLog");
  if (colIndex === -1) throw new Error("remarksLog column missing — redeploy Code.gs and try again.");
  var cell = prepared.sheet.getRange(rowIndex, colIndex + 1);
  var existing = cell.getValue();
  var log = [];
  if (existing) {
    try {
      log = JSON.parse(existing);
      if (!Array.isArray(log)) log = [];
    } catch (e) {
      log = [];
    }
  }
  log.push({ text: String(text).trim(), at: new Date().toISOString(), by: by ? String(by).trim() : "" });
  cell.setValue(JSON.stringify(log));
  return { id: id, remarksLog: log };
}

function deleteRow(sheetName, id) {
  var prepared = prepareSheet(sheetName);
  var rowIndex = findRowIndexById(prepared.sheet, id);
  if (rowIndex === -1) throw new Error("Record not found: " + id);
  prepared.sheet.deleteRow(rowIndex);
  return { id: id };
}

// ---------- Quick call notes ----------

var VOICE_FOLDER_NAME = "MCM Voice Notes";

// The private Drive folder the voice recordings live in (created on first use).
function getVoiceFolder() {
  // remember the folder so later saves skip the (slow) search by name
  var props = PropertiesService.getScriptProperties();
  var saved = props.getProperty("VOICE_FOLDER_ID");
  if (saved) {
    try { return DriveApp.getFolderById(saved); } catch (e) { /* deleted: look again */ }
  }
  var it = DriveApp.getFoldersByName(VOICE_FOLDER_NAME);
  var folder = it.hasNext() ? it.next() : DriveApp.createFolder(VOICE_FOLDER_NAME);
  props.setProperty("VOICE_FOLDER_ID", folder.getId());
  return folder;
}

// Saves one note. Safe to retry: the phone sends a clientId, and if a row with
// that clientId already exists (the first try worked but the reply was lost)
// the existing note is returned instead of saving a duplicate.
function addQuickNote(p) {
  if (!p.clientId) throw new Error("clientId is required.");
  var prepared = prepareSheet("QuickNotes");
  var idCol = prepared.headers.indexOf("clientId");
  var lastRow = prepared.sheet.getLastRow();
  if (lastRow > 1) {
    // read just the two columns needed (much faster than the whole sheet)
    var ids = prepared.sheet.getRange(2, 1, lastRow - 1, idCol + 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (ids[i][idCol] === p.clientId) return { id: ids[i][0], duplicate: true };
    }
  }
  var fileId = "";
  var mime = "";
  if (p.audioBase64) {
    mime = String(p.audioMime || "audio/webm");
    var ext = mime.indexOf("mp4") !== -1 ? "m4a" : mime.indexOf("ogg") !== -1 ? "ogg" : "webm";
    var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HH-mm-ss");
    var blob = Utilities.newBlob(Utilities.base64Decode(p.audioBase64), mime, stamp + "_" + String(p.phone || "note") + "." + ext);
    fileId = getVoiceFolder().createFile(blob).getId();
  }
  var added = addRow("QuickNotes", {
    clientId: p.clientId, name: p.name, phone: p.phone, note: p.note,
    audioFileId: fileId, audioMime: mime, durationSec: p.durationSec || "", peaks: p.peaks || "", status: "new",
  });
  bumpQuickVersion();
  return added;
}

// Other phones check this tiny counter every few seconds and only fetch the
// list when it changes, so a new call shows up on every logged-in device fast.
function bumpQuickVersion() {
  PropertiesService.getScriptProperties().setProperty("QUICK_V", String(Date.now()));
}

// Second step of a save: the number and name are stored first (fast), then the
// recording is attached to that row.
function attachQuickAudio(p) {
  var prepared = prepareSheet("QuickNotes");
  var rowIndex = findRowIndexById(prepared.sheet, p.id);
  if (rowIndex === -1) throw new Error("Record not found: " + p.id);
  var fileCol = prepared.headers.indexOf("audioFileId");
  if (prepared.sheet.getRange(rowIndex, fileCol + 1).getValue()) return { id: p.id, duplicate: true };
  var mime = String(p.audioMime || "audio/webm");
  var ext = mime.indexOf("mp4") !== -1 ? "m4a" : mime.indexOf("ogg") !== -1 ? "ogg" : "webm";
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HH-mm-ss");
  var blob = Utilities.newBlob(Utilities.base64Decode(p.audioBase64), mime, stamp + "_" + String(p.phone || "note") + "." + ext);
  var fileId = getVoiceFolder().createFile(blob).getId();
  updateRow("QuickNotes", p.id, { audioFileId: fileId, audioMime: mime });
  bumpQuickVersion();
  return { id: p.id };
}

// Returns a recording as base64. Only files that belong to a QuickNotes row can
// be read, so this can never be used to open other files in the Drive.
function getQuickAudio(id) {
  var rows = readSheet("QuickNotes");
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].id === id && rows[i].audioFileId) {
      var blob = DriveApp.getFileById(rows[i].audioFileId).getBlob();
      return { mime: rows[i].audioMime || blob.getContentType(), base64: Utilities.base64Encode(blob.getBytes()) };
    }
  }
  throw new Error("No recording for this note.");
}

// Only these fields can be changed on a note after it is saved.
function quickPatch(patch) {
  var out = {};
  ["name", "phone", "note", "status"].forEach(function (k) {
    if (patch && patch[k] !== undefined) out[k] = patch[k];
  });
  return out;
}

function deleteQuickNote(id) {
  var prepared = prepareSheet("QuickNotes");
  var rowIndex = findRowIndexById(prepared.sheet, id);
  if (rowIndex === -1) return { id: id }; // already gone
  var fileCol = prepared.headers.indexOf("audioFileId");
  var fileId = prepared.sheet.getRange(rowIndex, fileCol + 1).getValue();
  prepared.sheet.deleteRow(rowIndex);
  if (fileId) {
    try {
      DriveApp.getFileById(fileId).setTrashed(true);
    } catch (e) {
      // file already removed: nothing to do
    }
  }
  return { id: id };
}

// ---------- Broadcast queue ----------
//
// The admin page queues a broadcast here (one row in "Broadcasts" plus one
// row per person in "BroadcastItems", each with their own ready-to-send
// text). The Adverzo Dispatch Console running on your PC polls agentPoll,
// sends each message with its mouse/keyboard automation, and reports back
// with agentReport. Nothing here sends WhatsApp messages itself.

var MAX_BROADCAST_ITEMS = 500;

function queueBroadcast(p) {
  var items = p.items || [];
  if (!items.length) throw new Error("Nobody to send to.");
  if (items.length > MAX_BROADCAST_ITEMS) throw new Error("Too many recipients in one broadcast (max " + MAX_BROADCAST_ITEMS + ").");

  var seen = {};
  var clean = [];
  items.forEach(function (it) {
    var phone = String(it.phone || "").replace(/\D/g, "");
    var text = String(it.text || "").trim();
    if (phone.length < 10 || phone.length > 15 || !text) return;
    var last10 = phone.slice(-10);
    if (seen[last10]) return; // never message the same number twice in one broadcast
    seen[last10] = true;
    clean.push({
      role: String(it.role || ""), leadId: String(it.leadId || ""), name: String(it.name || ""),
      phone: last10, text: text.slice(0, 4000),
    });
  });
  if (!clean.length) throw new Error("None of the recipients had a valid number and message.");

  var jobId = "BC-" + Utilities.getUuid().slice(0, 6).toUpperCase();
  var now = new Date().toISOString();
  var jobs = prepareSheet("Broadcasts");
  jobs.sheet.appendRow(jobs.headers.map(function (h) {
    var v = {
      id: jobId, timestamp: now, name: String(p.name || "Broadcast").slice(0, 120),
      message: String(p.message || "").slice(0, 4000), audience: String(p.audience || "").slice(0, 300),
      total: clean.length, sent: 0, failed: 0, status: "queued", claimedBy: "", updatedAt: now,
    };
    return v[h] !== undefined ? v[h] : "";
  }));

  var prepared = prepareSheet("BroadcastItems");
  var rows = clean.map(function (c, i) {
    var v = {
      id: jobId + "-" + (i + 1), jobId: jobId, idx: i + 1, role: c.role, leadId: c.leadId, name: c.name,
      phone: "'" + c.phone, text: c.text, status: "pending", error: "", updatedAt: now,
    };
    return prepared.headers.map(function (h) { return v[h] !== undefined ? v[h] : ""; });
  });
  prepared.sheet.getRange(prepared.sheet.getLastRow() + 1, 1, rows.length, prepared.headers.length).setValues(rows);
  return { id: jobId, total: clean.length, skipped: items.length - clean.length };
}

function recentJobs(limit) {
  return readSheet("Broadcasts").reverse().slice(0, limit || 20);
}

function listBroadcasts() {
  var props = PropertiesService.getScriptProperties();
  return {
    jobs: recentJobs(20),
    agentSeen: Number(props.getProperty("AGENT_SEEN") || 0),
    agentNote: props.getProperty("AGENT_NOTE") || "",
    now: Date.now(),
  };
}

function itemsOf(jobId) {
  return readSheet("BroadcastItems")
    .filter(function (r) { return r.jobId === jobId; })
    .sort(function (a, b) { return Number(a.idx) - Number(b.idx); })
    .map(function (r) { r.phone = String(r.phone).replace(/\D/g, ""); return r; });
}

function getBroadcast(id) {
  var job = readSheet("Broadcasts").filter(function (j) { return j.id === id; })[0];
  if (!job) throw new Error("Broadcast not found.");
  return { job: job, items: itemsOf(id) };
}

function setCells(sheet, headers, rowIndex, patch) {
  Object.keys(patch).forEach(function (k) {
    var col = headers.indexOf(k);
    if (col !== -1) sheet.getRange(rowIndex, col + 1).setValue(patch[k]);
  });
}

// Recounts a job from its items and closes it when nothing is left to send.
function refreshJob(jobId) {
  var items = itemsOf(jobId);
  var sent = 0, failed = 0, open = 0;
  items.forEach(function (r) {
    if (r.status === "sent") sent++;
    else if (r.status === "failed") failed++;
    else if (r.status === "pending" || r.status === "sending") open++;
  });
  var prepared = prepareSheet("Broadcasts");
  var row = findRowIndexById(prepared.sheet, jobId);
  if (row === -1) return null;
  var current = prepared.sheet.getRange(row, prepared.headers.indexOf("status") + 1).getValue();
  var status = current;
  if (current !== "cancelled") status = open === 0 ? (sent === 0 && failed > 0 ? "failed" : "done") : "running";
  setCells(prepared.sheet, prepared.headers, row, { sent: sent, failed: failed, status: status, updatedAt: new Date().toISOString() });
  return { sent: sent, failed: failed, status: status };
}

function cancelBroadcast(id) {
  var prepared = prepareSheet("BroadcastItems");
  var values = prepared.sheet.getDataRange().getValues();
  var jCol = prepared.headers.indexOf("jobId"), sCol = prepared.headers.indexOf("status"), uCol = prepared.headers.indexOf("updatedAt");
  var now = new Date().toISOString();
  for (var i = 1; i < values.length; i++) {
    if (values[i][jCol] === id && values[i][sCol] === "pending") {
      prepared.sheet.getRange(i + 1, sCol + 1).setValue("skipped");
      prepared.sheet.getRange(i + 1, uCol + 1).setValue(now);
    }
  }
  var jobs = prepareSheet("Broadcasts");
  var row = findRowIndexById(jobs.sheet, id);
  if (row === -1) throw new Error("Broadcast not found.");
  setCells(jobs.sheet, jobs.headers, row, { status: "cancelled", updatedAt: now });
  return { ok: true };
}

// The PC console calls this every few seconds. Returns the oldest unfinished
// broadcast (and its people still to send) or { job: null }.
function agentPoll(p) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty("AGENT_SEEN", String(Date.now()));
  props.setProperty("AGENT_NOTE", String(p.note || "").slice(0, 120));
  if (p.peek) return { job: null }; // heartbeat only: "I'm online but can't send right now"
  var agentId = String(p.agentId || "pc");
  var staleMs = 3 * 60 * 1000;

  var jobs = readSheet("Broadcasts").filter(function (j) {
    if (j.status === "queued") return true;
    if (j.status !== "running") return false;
    // a running job belongs to one PC; take it over only if that PC went quiet
    return j.claimedBy === agentId || Date.now() - new Date(j.updatedAt).getTime() > staleMs;
  });
  if (!jobs.length) return { job: null };
  var job = jobs[0]; // oldest first (sheet order)

  var jobsSheet = prepareSheet("Broadcasts");
  var row = findRowIndexById(jobsSheet.sheet, job.id);
  setCells(jobsSheet.sheet, jobsSheet.headers, row, { status: "running", claimedBy: agentId, updatedAt: new Date().toISOString() });

  var todo = itemsOf(job.id).filter(function (r) { return r.status === "pending" || r.status === "sending"; });
  return { job: { id: job.id, name: job.name, total: job.total }, items: todo };
}

// results: [{ itemId, status: "sending" | "sent" | "failed", error }]
function agentReport(p) {
  var results = p.results || [];
  var prepared = prepareSheet("BroadcastItems");
  var values = prepared.sheet.getDataRange().getValues();
  var idCol = prepared.headers.indexOf("id");
  var rowOf = {};
  for (var i = 1; i < values.length; i++) rowOf[values[i][idCol]] = i + 1;
  var now = new Date().toISOString();
  var allowed = { sending: true, sent: true, failed: true };
  results.forEach(function (r) {
    var row = rowOf[r.itemId];
    if (!row || !allowed[r.status]) return;
    setCells(prepared.sheet, prepared.headers, row, { status: r.status, error: String(r.error || "").slice(0, 300), updatedAt: now });
  });
  var jobId = String(p.jobId || "");
  if (jobId && p.cancelJob) cancelBroadcast(jobId); // console Stop / Skip: drop whatever is left
  var summary = jobId ? refreshJob(jobId) : null;
  PropertiesService.getScriptProperties().setProperty("AGENT_SEEN", String(Date.now()));
  return { ok: true, jobStatus: summary ? summary.status : "unknown", sent: summary ? summary.sent : 0, failed: summary ? summary.failed : 0 };
}

function checkAgent(p) {
  var props = PropertiesService.getScriptProperties();
  var given = String(p.key || "");
  var agentKey = props.getProperty("AGENT_KEY");
  var admin = props.getProperty("ADMIN_PASSWORD");
  if (given && ((agentKey && given === agentKey) || (admin && given === admin))) return;
  throw new Error("Wrong agent key");
}

/**
 * Optional, run ONCE from the editor: creates a separate key for the PC
 * console so it never needs your admin password. View > Logs shows the key;
 * paste it into the console's data/admin_sync.json as "agent_key".
 */
function createAgentKey() {
  var key = Utilities.getUuid().replace(/-/g, "").slice(0, 20);
  PropertiesService.getScriptProperties().setProperty("AGENT_KEY", key);
  Logger.log("AGENT KEY: " + key);
  return key;
}

function checkPassword(password) {
  var expected = PropertiesService.getScriptProperties().getProperty("ADMIN_PASSWORD");
  if (!expected) throw new Error("Admin password not configured — run setup() once in the Apps Script editor.");
  if (password !== expected) throw new Error("Wrong password");
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Run this ONCE from the Apps Script editor (select "setup" in the function
 * dropdown, then click Run) to set your admin password. Change the value
 * below first, then run it, then you can delete/ignore this function.
 */
function setup() {
  PropertiesService.getScriptProperties().setProperty("ADMIN_PASSWORD", "changeme123");
  ["Mediators", "Sellers", "Buyers", "Properties", "QuickNotes", "Broadcasts", "BroadcastItems"].forEach(getSheet);
  Logger.log("Setup complete. Admin password set — remember to change it!");
}

/**
 * Run this ONCE (select "authorizeVoiceNotes", click Run) after pasting the
 * new Code.gs. It asks Google for permission to keep voice recordings in your
 * Drive and creates the "MCM Voice Notes" folder + the QuickNotes sheet.
 * It does NOT touch your admin password (do not re-run setup()).
 */
function authorizeVoiceNotes() {
  getVoiceFolder();
  getSheet("QuickNotes");
  Logger.log("Ready. Voice notes will be saved in the Drive folder: " + VOICE_FOLDER_NAME);
}
