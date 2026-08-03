import { APPS_SCRIPT_URL } from "./config";

/**
 * All reads/writes go through the single Apps Script Web App endpoint.
 * We POST an { action, payload } envelope and always get back
 * { ok: boolean, data?: any, error?: string }.
 *
 * Apps Script Web Apps don't reliably support custom headers / preflight
 * from the browser, so we send a text/plain body (avoids CORS preflight)
 * containing JSON, which Code.gs parses manually.
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callApiOnce(action, payload) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, payload }),
  });

  if (!res.ok) {
    throw new Error(`Server error (${res.status})`);
  }

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(
      "The server didn't return valid data — this usually means the Apps Script deployment's " +
        '"Who has access" setting isn\'t set to "Anyone", or it needs redeploying as a new version.'
    );
  }
  if (!json.ok) {
    throw new Error(json.error || "Something went wrong");
  }
  return json.data;
}

// Google's Apps Script redirect layer occasionally returns a transient
// error (e.g. a 404 from its internal echo endpoint) even when the
// deployment itself is healthy. Retrying almost always succeeds, so we
// retry automatically before surfacing anything to the user — this is
// separate from genuine errors like a wrong password, which come back as
// a normal { ok: false } response and are never retried.
async function callApi(action, payload = {}, attempt = 1) {
  const MAX_ATTEMPTS = 3;
  try {
    return await callApiOnce(action, payload);
  } catch (err) {
    const isTransient = /^Server error \(\d+\)$/.test(err.message) || /didn't return valid data/.test(err.message);
    if (isTransient && attempt < MAX_ATTEMPTS) {
      await delay(attempt * 500);
      return callApi(action, payload, attempt + 1);
    }
    throw err;
  }
}

// ---------- Public (no login required) ----------

export const addMediatorLead = (payload) => callApi("addMediator", payload);
export const addSellerLead = (payload) => callApi("addSeller", payload);
export const addBuyerLead = (payload) => callApi("addBuyer", payload);
export const listPublicProperties = () => callApi("listProperties");

// ---------- Admin (password required, checked server-side per call) ----------

export const adminLogin = (password) => callApi("adminLogin", { password });

export const adminListMediators = (password) =>
  callApi("listMediators", { password });

export const adminListSellers = (password) =>
  callApi("listSellers", { password });

export const adminListBuyers = (password) =>
  callApi("listBuyers", { password });

export const adminUpdateLead = (password, sheet, id, patch) =>
  callApi("updateLead", { password, sheet, id, patch });

export const adminAddRemark = (password, sheet, id, text, by) =>
  callApi("addRemark", { password, sheet, id, text, by });

export const adminAddVisit = (password, sheet, id, visit, by) =>
  callApi("addVisit", { password, sheet, id, ...visit, by });

export const adminAddProperty = (password, payload) =>
  callApi("addProperty", { password, ...payload });

export const adminUpdateProperty = (password, id, payload) =>
  callApi("updateProperty", { password, id, ...payload });

export const adminDeleteProperty = (password, id) =>
  callApi("deleteProperty", { password, id });
