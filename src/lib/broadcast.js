// ─────────────────────────────────────────────────────────────
// Broadcast — bulk WhatsApp messaging to the people already in your CRM.
//
// Modelled on the Adverzo Dispatch Console: saved templates, {{greeting}} /
// {{date}} / {{time}} placeholders that fill at send time, a recipient
// list, and a run history. Pure functions + a tiny localStorage store, no
// new backend calls.
// ─────────────────────────────────────────────────────────────

import { isClosed, leadScore, normPhone } from "./insights";

export const ROLES = ["buyer", "seller", "mediator"];
export const SHEET = { seller: "Sellers", buyer: "Buyers", mediator: "Mediators" };

// ---------- phone numbers ----------

/** WhatsApp wants country code + number, digits only. Indian numbers get 91. */
export function toWhatsApp(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  if (d.length === 10) return `91${d}`;
  if (d.length === 12 && d.startsWith("91")) return d;
  if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
  if (d.length >= 11 && d.length <= 15) return d;
  return "";
}

export function waUrl(phone, text) {
  return `https://wa.me/${toWhatsApp(phone)}?text=${encodeURIComponent(text || "")}`;
}

// ---------- lead field helpers ----------

export const areaOf = (l) => l.area || l.propertyLocation || l.preferredLocation || l.workingArea || "";
export const typeOf = (l) => l.propertyType || l.propertyCategory || l.profession || "";
const firstName = (n) => String(n || "").trim().split(/\s+/)[0] || "";

// ---------- message variables ----------

export const VARIABLES = [
  { key: "first_name", label: "First name", sample: "Ravi" },
  { key: "name", label: "Full name", sample: "Ravi Kumar" },
  { key: "greeting", label: "Greeting", sample: "Good morning" },
  { key: "area", label: "Area", sample: "Ambattur" },
  { key: "property_type", label: "Property type", sample: "Apartment / Flat" },
  { key: "budget", label: "Budget / price", sample: "₹30–50 Lakhs" },
  { key: "date", label: "Today's date", sample: "13-10-2026" },
  { key: "time", label: "Current time", sample: "10:48 AM" },
  { key: "sender", label: "Your name", sample: "Naveen" },
];

export function greetingNow(now = new Date()) {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const pad = (n) => String(n).padStart(2, "0");
const dateText = (d) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
const timeText = (d) => `${pad(d.getHours() % 12 || 12)}:${pad(d.getMinutes())} ${d.getHours() < 12 ? "AM" : "PM"}`;

/**
 * Fills {{placeholders}} for one recipient. Unknown / empty values fall back
 * to something that still reads naturally, so a message never goes out with a
 * visible "{{area}}" or a double space in it.
 */
export function renderMessage(template, lead, sender = "", now = new Date()) {
  const l = lead || {};
  const values = {
    first_name: firstName(l.name) || "there",
    name: String(l.name || "").trim() || "there",
    greeting: greetingNow(now),
    area: areaOf(l) || "your area",
    property_type: typeOf(l) || "property",
    budget: l.budget || l.expectedPrice || "your budget",
    date: dateText(now),
    time: timeText(now),
    sender: sender || "Middle Class Mediator",
  };
  return String(template || "")
    .replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (m, k) => (k.toLowerCase() in values ? values[k.toLowerCase()] : m))
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

/** Placeholders that don't exist — shown as a warning before sending. */
export function unknownPlaceholders(template) {
  const known = new Set(VARIABLES.map((v) => v.key));
  const bad = new Set();
  String(template || "").replace(/\{\{\s*([^}]*?)\s*\}\}/g, (m, k) => {
    if (!known.has(k.toLowerCase())) bad.add(m);
    return m;
  });
  return [...bad];
}

// ---------- starter templates ----------

export const STARTER_TEMPLATES = [
  {
    id: "starter-followup",
    name: "Friendly follow-up",
    text: "{{greeting}} {{first_name}}! This is {{sender}} from Middle Class Mediator. You registered with us looking at {{property_type}} options in {{area}} — are you still interested? Reply YES and I'll share the latest options.",
  },
  {
    id: "starter-new-listings",
    name: "New listings alert",
    text: "{{greeting}} {{first_name}}! New properties just went live on our gallery. See them here: https://middle-class-mediator-murex.vercel.app/gallery\n\nTell me your budget and I'll shortlist the best ones for you.\n\n— {{sender}}",
  },
  {
    id: "starter-seller-update",
    name: "Seller — confirm availability",
    text: "{{greeting}} {{first_name}}, is your {{property_type}} in {{area}} still available? We have genuine buyers asking. Please reply with your best price.\n\n— {{sender}}",
  },
  {
    id: "starter-visit",
    name: "Site visit invite",
    text: "{{greeting}} {{first_name}}! Shall we plan a site visit this week to see options in {{area}}? Tell me a day and time that suits you.\n\n— {{sender}}",
  },
  {
    id: "starter-festival",
    name: "Festival wishes",
    text: "{{greeting}} {{first_name}}! Warm festival wishes from all of us at Middle Class Mediator 🪔 May your new home dreams come true this year.\n\n— {{sender}}",
  },
];

// ---------- audience ----------

export const DEFAULT_FILTERS = {
  roles: ["buyer"],
  statuses: [],
  areas: [],
  types: [],
  heat: [],
  addedWithin: "all", // all | 7 | 30 | 90
  hideClosed: true,
  search: "",
};

/** Every lead across the chosen roles, tagged with role and a sendable number. */
export function allCandidates(data, roles) {
  const out = [];
  roles.forEach((role) => {
    (data[role] || []).forEach((lead) => {
      out.push({ role, lead, wa: toWhatsApp(lead.phone), key: `${role}:${lead.id}` });
    });
  });
  return out;
}

export function applyFilters(cands, f) {
  const q = f.search.trim().toLowerCase();
  const cutoff = f.addedWithin === "all" ? null : Date.now() - Number(f.addedWithin) * 86400000;
  return cands.filter(({ role, lead }) => {
    if (f.hideClosed && isClosed(role, lead)) return false;
    if (f.statuses.length && !f.statuses.includes(lead.status || "New")) return false;
    if (f.areas.length && !f.areas.includes(areaOf(lead))) return false;
    if (f.types.length && !f.types.includes(typeOf(lead))) return false;
    if (f.heat.length && !f.heat.includes(leadScore(role, lead).tier)) return false;
    if (cutoff) {
      const t = new Date(lead.timestamp).getTime();
      if (isNaN(t) || t < cutoff) return false;
    }
    if (q) {
      const hay = `${lead.name || ""} ${lead.phone || ""} ${areaOf(lead)} ${typeOf(lead)}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Counts of a value across candidates, biggest first — drives the chip lists. */
export function tally(cands, getValue, limit = 14) {
  const m = {};
  cands.forEach((c) => {
    const v = getValue(c);
    if (v) m[v] = (m[v] || 0) + 1;
  });
  return Object.entries(m)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
}

/**
 * One row per unique phone number. The same person registered twice (or as
 * both buyer and seller) is only messaged once, so nobody gets duplicates.
 */
export function dedupeByPhone(cands) {
  const seen = new Set();
  const out = [];
  cands.forEach((c) => {
    const k = normPhone(c.lead.phone) || c.key;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(c);
  });
  return out;
}

// ---------- local store: custom templates + send log ----------

const STORE_KEY = "mcm_broadcast_v1";
const LOG_DAYS = 30;

function readStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    return { templates: raw.templates || [], log: raw.log || [], runs: raw.runs || [] };
  } catch {
    return { templates: [], log: [], runs: [] };
  }
}

function writeStore(s) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    // storage full / blocked — the feature still works, it just won't remember
  }
}

export function loadTemplates() {
  return readStore().templates;
}

export function saveTemplate(name, text) {
  const s = readStore();
  const id = `t-${Date.now().toString(36)}`;
  s.templates = [{ id, name: name.trim() || "Untitled", text }, ...s.templates].slice(0, 30);
  writeStore(s);
  return s.templates;
}

export function deleteTemplate(id) {
  const s = readStore();
  s.templates = s.templates.filter((t) => t.id !== id);
  writeStore(s);
  return s.templates;
}

/** Cheap stable hash so "same message" can be recognised without storing it. */
export function hashText(text) {
  let h = 5381;
  const s = String(text || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Who already got this exact message recently → Map(key → timestamp). */
export function recentlySent(template) {
  const h = hashText(template);
  const cutoff = Date.now() - 7 * 86400000;
  const m = new Map();
  readStore().log.forEach((e) => {
    if (e.h === h && e.t >= cutoff) m.set(e.k, e.t);
  });
  return m;
}

export function logSent(key, template) {
  const s = readStore();
  const cutoff = Date.now() - LOG_DAYS * 86400000;
  s.log = [...s.log.filter((e) => e.t >= cutoff), { k: key, h: hashText(template), t: Date.now() }].slice(-3000);
  writeStore(s);
}

export function unlogSent(key, template) {
  const s = readStore();
  const h = hashText(template);
  s.log = s.log.filter((e) => !(e.k === key && e.h === h));
  writeStore(s);
}

/** Insert or update a run (matched by id) so one session is one history row. */
export function recordRun(run) {
  const s = readStore();
  const rest = s.runs.filter((r) => r.id !== run.id);
  s.runs = [run, ...rest].slice(0, 20);
  writeStore(s);
  return s.runs;
}

export function loadRuns() {
  return readStore().runs;
}

// ---------- hand-off to the Adverzo Dispatch Console ----------

/**
 * The console only understands {{greeting}}, {{date}} and {{time}}. Anything
 * personal ({{first_name}}, {{area}} …) can't vary per person there, so it is
 * swapped for a neutral word before export.
 */
export function toConsoleMessage(template, sender = "") {
  const neutral = { first_name: "there", name: "there", area: "your area", property_type: "property", budget: "your budget", sender: sender || "Middle Class Mediator" };
  return String(template || "").replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (m, k) => {
    const key = k.toLowerCase();
    if (key === "greeting" || key === "date" || key === "time") return `{{${key}}}`;
    return key in neutral ? neutral[key] : m;
  });
}

/** Same shape as the console's data/numbers.json: an array of 10-digit strings. */
export function toConsoleNumbers(rows) {
  return rows.map((r) => normPhone(r.lead.phone)).filter(Boolean);
}

export function toCsv(rows, template, sender) {
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = ["name", "role", "phone", "whatsapp", "area", "status", "message"];
  const lines = rows.map((r) =>
    [r.lead.name, r.role, r.lead.phone, r.wa, areaOf(r.lead), r.lead.status || "New", renderMessage(template, r.lead, sender)].map(esc).join(",")
  );
  return "﻿" + [head.join(","), ...lines].join("\r\n");
}
