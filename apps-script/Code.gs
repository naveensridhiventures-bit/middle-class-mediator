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
 * the first time each sheet is read or written after you redeploy this file,
 * ensureColumns() below will automatically add any missing columns
 * (priority, followUpDate, remarksLog) to the end of that sheet's header row
 * without touching your existing data.
 */

const SHEETS = {
  Mediators: ["id", "timestamp", "name", "phone", "profession", "workingArea", "propertyCategory", "experience", "dealType", "genuineLeads", "status", "priority", "followUpDate", "area", "remarksLog"],
  Sellers: ["id", "timestamp", "name", "phone", "propertyType", "propertyLocation", "propertyStatus", "expectedPrice", "ownership", "timeline", "status", "priority", "followUpDate", "area", "budgetValue", "sqft", "remarksLog"],
  Buyers: ["id", "timestamp", "name", "phone", "propertyType", "purpose", "budget", "preferredLocation", "loanRequirement", "timeline", "status", "priority", "followUpDate", "area", "budgetValue", "sqft", "remarksLog"],
  Properties: ["id", "timestamp", "title", "type", "location", "price", "description", "imageUrl", "contactPhone"],
};

function doGet() {
  return jsonResponse({ ok: true, data: "Middle Class Mediator API is running." });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var req = JSON.parse(e.postData.contents);
    var action = req.action;
    var p = req.payload || {};
    var result;

    switch (action) {
      case "addMediator":
        result = addRow("Mediators", {
          name: p.name, phone: p.phone, profession: p.profession, workingArea: p.workingArea,
          propertyCategory: p.propertyCategory, experience: p.experience, dealType: p.dealType,
          genuineLeads: p.genuineLeads, status: "New", priority: 3, followUpDate: "", remarksLog: "[]",
        });
        break;

      case "addSeller":
        result = addRow("Sellers", {
          name: p.name, phone: p.phone, propertyType: p.propertyType, propertyLocation: p.propertyLocation,
          propertyStatus: p.propertyStatus, expectedPrice: p.expectedPrice, ownership: p.ownership,
          timeline: p.timeline, status: "New", priority: 3, followUpDate: "", remarksLog: "[]",
        });
        break;

      case "addBuyer":
        result = addRow("Buyers", {
          name: p.name, phone: p.phone, propertyType: p.propertyType, purpose: p.purpose,
          budget: p.budget, preferredLocation: p.preferredLocation, loanRequirement: p.loanRequirement,
          timeline: p.timeline, status: "New", priority: 3, followUpDate: "", remarksLog: "[]",
        });
        break;

      case "listProperties":
        result = readSheet("Properties");
        break;

      case "adminLogin":
        checkPassword(p.password);
        result = true;
        break;

      case "listMediators":
        checkPassword(p.password);
        result = readSheet("Mediators");
        break;

      case "listSellers":
        checkPassword(p.password);
        result = readSheet("Sellers");
        break;

      case "listBuyers":
        checkPassword(p.password);
        result = readSheet("Buyers");
        break;

      // Updates any editable field on a lead — original submitted details
      // (name, phone, property type, etc.), status, priority, follow-up
      // date, and the admin-set area/budget/size metadata. Never touches
      // id, timestamp, or remarksLog (use "addRemark" for remarks so
      // history is additive and never overwritten).
      case "updateLead":
        checkPassword(p.password);
        result = updateRow(p.sheet, p.id, sanitizePatch(p.patch));
        break;

      // Appends a single dated remark to the lead's remarksLog (stored as a
      // JSON array in one cell) instead of overwriting previous notes.
      case "addRemark":
        checkPassword(p.password);
        result = appendRemark(p.sheet, p.id, p.text, p.by);
        break;

      case "addProperty":
        checkPassword(p.password);
        result = addRow("Properties", {
          title: p.title, type: p.type, location: p.location, price: p.price,
          description: p.description, imageUrl: p.imageUrl, contactPhone: p.contactPhone,
        });
        break;

      case "updateProperty":
        checkPassword(p.password);
        result = updateRow("Properties", p.id, {
          title: p.title, type: p.type, location: p.location, price: p.price,
          description: p.description, imageUrl: p.imageUrl, contactPhone: p.contactPhone,
        });
        break;

      case "deleteProperty":
        checkPassword(p.password);
        result = deleteRow("Properties", p.id);
        break;

      default:
        throw new Error("Unknown action: " + action);
    }

    return jsonResponse({ ok: true, data: result });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

// ---------- helpers ----------

function getHeaders(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
}

// Adds any headers from SHEETS[name] that are missing from the sheet's
// current header row, appending them as new columns at the end. Safe to
// call every time — a no-op once the sheet is already up to date.
function ensureColumns(sheet, name) {
  var required = SHEETS[name];
  if (!required) return;
  var headers = getHeaders(sheet);
  var missing = required.filter(function (h) {
    return headers.indexOf(h) === -1;
  });
  if (missing.length > 0) {
    var startCol = headers.length + 1;
    sheet.getRange(1, startCol, 1, missing.length).setValues([missing]);
  }
}

function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(SHEETS[name]);
    sheet.setFrozenRows(1);
  } else {
    ensureColumns(sheet, name);
  }
  return sheet;
}

function addRow(sheetName, data) {
  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheet);
  var id = sheetName.substring(0, 3).toUpperCase() + "-" + Utilities.getUuid().slice(0, 6).toUpperCase();
  var row = headers.map(function (h) {
    if (h === "id") return id;
    if (h === "timestamp") return new Date().toISOString();
    if (h === "remarksLog" && data[h] === undefined) return "[]";
    return data[h] !== undefined ? data[h] : "";
  });
  sheet.appendRow(row);
  return { id: id };
}

function readSheet(sheetName) {
  var sheet = getSheet(sheetName);
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
  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheet);
  var rowIndex = findRowIndexById(sheet, id);
  if (rowIndex === -1) throw new Error("Record not found: " + id);
  Object.keys(patch).forEach(function (key) {
    var colIndex = headers.indexOf(key);
    if (colIndex !== -1 && patch[key] !== undefined) {
      sheet.getRange(rowIndex, colIndex + 1).setValue(patch[key]);
    }
  });
  return { id: id };
}

// Reads the existing remarksLog JSON array for a lead, pushes a new
// { text, at } entry onto it (never removing previous entries), and saves
// it back as a JSON string in the same cell.
function appendRemark(sheetName, id, text, by) {
  if (!text || !String(text).trim()) throw new Error("Remark text is required.");
  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheet);
  var rowIndex = findRowIndexById(sheet, id);
  if (rowIndex === -1) throw new Error("Record not found: " + id);
  var colIndex = headers.indexOf("remarksLog");
  if (colIndex === -1) throw new Error("remarksLog column missing — redeploy Code.gs and try again.");
  var cell = sheet.getRange(rowIndex, colIndex + 1);
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
  var sheet = getSheet(sheetName);
  var rowIndex = findRowIndexById(sheet, id);
  if (rowIndex === -1) throw new Error("Record not found: " + id);
  sheet.deleteRow(rowIndex);
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
