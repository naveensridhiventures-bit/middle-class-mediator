/**
 * MIDDLE CLASS MEDIATOR — Google Sheets backend
 * ------------------------------------------------
 * Paste this whole file into Extensions > Apps Script of your Google Sheet,
 * then deploy as a Web App (see README.md for the full walkthrough).
 *
 * Sheet tabs used (created automatically the first time they're needed):
 *   Mediators, Sellers, Buyers, Properties
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
  Mediators: ["id", "timestamp", "name", "phone", "profession", "workingArea", "propertyCategory", "experience", "dealType", "genuineLeads", "status", "priority", "followUpDate", "area", "customFields", "remarksLog"],
  Sellers: ["id", "timestamp", "name", "phone", "propertyType", "propertyLocation", "propertyStatus", "expectedPrice", "ownership", "timeline", "status", "priority", "followUpDate", "area", "budgetValue", "sqft", "customFields", "photos", "exactAddress", "mapLink", "visitLog", "remarksLog"],
  Buyers: ["id", "timestamp", "name", "phone", "propertyType", "purpose", "budget", "preferredLocation", "loanRequirement", "timeline", "status", "priority", "followUpDate", "area", "budgetValue", "sqft", "customFields", "remarksLog"],
  Properties: ["id", "timestamp", "title", "type", "location", "price", "sqft", "description", "imageUrl", "images", "attributes", "contactPhone", "refId", "soldOut"],
};

// Actions in this set take the script lock and go through column
// migration (prepareSheet). Everything else is treated as read-only and
// skips both for speed.
const WRITE_ACTIONS = {
  addMediator: true, addSeller: true, addBuyer: true,
  updateLead: true, addRemark: true, addVisit: true,
  addProperty: true, updateProperty: true, deleteProperty: true,
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
        propertyStatus: p.propertyStatus, expectedPrice: p.expectedPrice, ownership: p.ownership,
        timeline: p.timeline, status: "New", priority: 3, followUpDate: "", customFields: "{}", photos: "[]", visitLog: "[]", remarksLog: "[]",
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
          description: p.description, imageUrl: p.imageUrl, images: p.images, attributes: p.attributes, contactPhone: p.contactPhone, refId: p.refId, soldOut: p.soldOut,
        });

      case "updateProperty":
        checkPassword(p.password);
        return updateRow("Properties", p.id, {
          title: p.title, type: p.type, location: p.location, price: p.price, sqft: p.sqft,
          description: p.description, imageUrl: p.imageUrl, images: p.images, attributes: p.attributes, contactPhone: p.contactPhone, refId: p.refId, soldOut: p.soldOut,
        });

    case "deleteProperty":
      checkPassword(p.password);
      return deleteRow("Properties", p.id);

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
  ["Mediators", "Sellers", "Buyers", "Properties"].forEach(getSheet);
  Logger.log("Setup complete. Admin password set — remember to change it!");
}
