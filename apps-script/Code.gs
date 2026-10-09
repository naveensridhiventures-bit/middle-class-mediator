/**
 * MIDDLE CLASS MEDIATOR — Google Sheets backend
 * ------------------------------------------------
 * Paste this whole file into Extensions > Apps Script of your Google Sheet,
 * then deploy as a Web App (see README.md for the full walkthrough).
 *
 * Sheet tabs used (created automatically the first time they're needed):
 *   Mediators, Sellers, Buyers, Properties, QuickNotes
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
  ["Mediators", "Sellers", "Buyers", "Properties", "QuickNotes"].forEach(getSheet);
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
