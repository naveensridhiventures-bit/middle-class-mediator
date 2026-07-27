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
async function callApi(action, payload = {}) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, payload }),
  });

  if (!res.ok) {
    throw new Error(`Server error (${res.status})`);
  }

  const json = await res.json();
  if (!json.ok) {
    throw new Error(json.error || "Something went wrong");
  }
  return json.data;
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
  callApi("updateLead", { password, sheet, id, ...patch });

export const adminAddRemark = (password, sheet, id, text, by) =>
  callApi("addRemark", { password, sheet, id, text, by });

export const adminAddProperty = (password, payload) =>
  callApi("addProperty", { password, ...payload });

export const adminUpdateProperty = (password, id, payload) =>
  callApi("updateProperty", { password, id, ...payload });

export const adminDeleteProperty = (password, id) =>
  callApi("deleteProperty", { password, id });
