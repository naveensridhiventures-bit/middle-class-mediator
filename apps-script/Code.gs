/**
 * MIDDLE CLASS MEDIATOR — Google Sheets backend
 * ------------------------------------------------
 * Paste this whole file into Extensions > Apps Script of your Google Sheet,
 * then deploy as a Web App (see README.md for the full walkthrough).
 *
 * Sheet tabs used (created automatically the first time they're needed):
 *   Mediators, Sellers, Properties
 */

const SHEETS = {
  Mediators: ["id", "timestamp", "name", "phone", "instaRef", "propertyTitle", "location", "price", "message", "imageUrl", "status", "remarks"],
  Sellers: ["id", "timestamp", "name", "phone", "propertyType", "location", "price", "details", "imageUrl", "status", "remarks"],
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
          name: p.name, phone: p.phone, instaRef: p.instaRef, propertyTitle: p.propertyTitle,
          location: p.location, price: p.price, message: p.message, imageUrl: p.imageUrl,
          status: "New", remarks: "",
        });
        break;

      case "addSeller":
        result = addRow("Sellers", {
          name: p.name, phone: p.phone, propertyType: p.propertyType, location: p.location,
          price: p.price, details: p.details, imageUrl: p.imageUrl, status: "New", remarks: "",
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

      case "updateRemark":
        checkPassword(p.password);
        result = updateRow(p.sheet, p.id, { status: p.status, remarks: p.remarks });
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

function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(SHEETS[name]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function addRow(sheetName, data) {
  var sheet = getSheet(sheetName);
  var headers = SHEETS[sheetName];
  var id = sheetName.substring(0, 3).toUpperCase() + "-" + Utilities.getUuid().slice(0, 6).toUpperCase();
  var row = headers.map(function (h) {
    if (h === "id") return id;
    if (h === "timestamp") return new Date().toISOString();
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

function updateRow(sheetName, id, patch) {
  var sheet = getSheet(sheetName);
  var headers = SHEETS[sheetName];
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
  ["Mediators", "Sellers", "Properties"].forEach(getSheet);
  Logger.log("Setup complete. Admin password set — remember to change it!");
}
