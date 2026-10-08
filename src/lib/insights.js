// ─────────────────────────────────────────────────────────────
// CRM intelligence — everything here is pure functions over the lead rows
// you already have in Google Sheets. No new columns, no new backend calls.
//
//   • leadScore()        0–100 heat score with a Hot / Warm / Cold tier
//   • isClosed/isOverdue role-aware (fixes "Worthless" leads showing Overdue)
//   • buildTasks()       the daily follow-up queue
//   • scoreMatch()       buyer ↔ property matching with human reasons
//   • templatesFor()     ready-to-send WhatsApp messages
//   • computeOverview()  KPIs, intake chart, funnels, demand vs supply
// ─────────────────────────────────────────────────────────────

const LAKH = 100000;
const CRORE = 10000000;
const DAY = 86400000;

// ---------- parsing helpers ----------

function parseJson(raw, fallback) {
  if (!raw) return fallback;
  if (typeof raw !== "string") return raw;
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export function getRemarks(lead) {
  const v = parseJson(lead.remarksLog, []);
  return Array.isArray(v) ? v : [];
}

export function getVisits(lead) {
  const v = parseJson(lead.visitLog, []);
  return Array.isArray(v) ? v : [];
}

export function getCustom(lead) {
  const v = parseJson(lead.customFields, {});
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}

function num(v) {
  if (v === undefined || v === null || v === "") return NaN;
  return Number(String(v).replace(/[^\d.]/g, ""));
}

// ---------- dates ----------

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Parses "YYYY-MM-DD" (as a local date) or any ISO string into a local day. */
export function parseDay(v) {
  if (!v) return null;
  const s = String(v).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(s);
  if (isNaN(d)) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

export function dayDiff(date) {
  return Math.round((date.getTime() - startOfToday().getTime()) / DAY);
}

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysISO(n) {
  const d = startOfToday();
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function lastActivity(lead) {
  const times = [lead.timestamp, ...getRemarks(lead).map((r) => r.at), ...getVisits(lead).map((v) => v.at)]
    .map((t) => new Date(t).getTime())
    .filter((n) => !isNaN(n));
  return times.length ? Math.max(...times) : null;
}

export function daysSince(ms) {
  if (!ms) return Infinity;
  return Math.floor((Date.now() - ms) / DAY);
}

// ---------- money ----------

export const PRICE_BANDS = {
  "Below ₹30 Lakhs": [0, 30 * LAKH],
  "₹30–50 Lakhs": [30 * LAKH, 50 * LAKH],
  "₹50–75 Lakhs": [50 * LAKH, 75 * LAKH],
  "₹75 Lakhs–₹1 Crore": [75 * LAKH, CRORE],
  "Above ₹1 Crore": [CRORE, Infinity],
};

const trim = (x) => String(Math.round(x * 100) / 100);

export function formatINR(n) {
  if (!isFinite(n) || n <= 0) return "—";
  if (n >= CRORE) return `₹${trim(n / CRORE)} Cr`;
  if (n >= LAKH) return `₹${trim(n / LAKH)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

// ---------- status logic (role-aware) ----------

// Stages after which there is nothing left to chase. Seller has none: every
// seller stage is still a live conversation until the listing is sold out.
const CLOSED_STATUS = { seller: [], buyer: ["Worthless"], mediator: ["Visited"] };

export function isClosed(role, lead) {
  const s = lead.status;
  if (s === "Closed" || s === "Dropped") return true;
  if ((CLOSED_STATUS[role] || []).includes(s)) return true;
  if (role === "mediator" && lead.status2 === "Not worth") return true;
  if (role === "seller" && getCustom(lead).soldOut === "true") return true;
  return false;
}

export function isOverdue(role, lead) {
  if (isClosed(role, lead)) return false;
  const d = parseDay(lead.followUpDate);
  return Boolean(d) && dayDiff(d) < 0;
}

// ---------- lead score ----------

const URGENCY = { Immediately: 1, "Within 1 Month": 0.75, "Within 3 Months": 0.45, "Just Exploring": 0.12 };
const EXPERIENCE_PTS = { "Above 5 Years": 20, "3–5 Years": 15, "1–3 Years": 10, "Below 1 Year": 5 };

const FILL_KEYS = {
  seller: ["propertyType", "propertyLocation", "propertyStatus", "expectedPrice", "ownership", "landArea", "facing", "roadWidth", "pattaApproval", "photosShared"],
  buyer: ["propertyType", "purpose", "budget", "preferredLocation", "loanRequirement", "timeline"],
  mediator: ["profession", "workingArea", "propertyCategory", "experience", "dealType"],
};

export const TIERS = {
  Hot: "#C4503F",
  Warm: "#C89B3C",
  Cold: "#6B7A99",
  Closed: "#8A93A5",
};

export function leadScore(role, lead) {
  if (isClosed(role, lead)) return { score: 0, tier: "Closed", color: TIERS.Closed, reasons: [] };

  let pts = 0;
  const reasons = [];
  const add = (n, why) => {
    if (n <= 0) return;
    pts += n;
    reasons.push({ pts: Math.round(n), why });
  };

  const prio = Math.min(5, Math.max(0, Number(lead.priority) || 0));
  add(prio * 4, `${prio}★ priority`);

  const digits = String(lead.phone || "").replace(/\D/g, "");
  add(digits.length >= 10 ? 10 : 0, "Reachable by phone");

  const keys = FILL_KEYS[role] || [];
  const filled = keys.filter((k) => String(lead[k] ?? "").trim()).length;
  add(keys.length ? (filled / keys.length) * 15 : 0, "Complete details");

  const idle = daysSince(lastActivity(lead));
  add(idle <= 3 ? 15 : idle <= 7 ? 10 : idle <= 14 ? 5 : 0, idle <= 3 ? "Active in the last 3 days" : "Recent activity");

  if (role === "mediator") {
    add(EXPERIENCE_PTS[lead.experience] || 0, `${lead.experience || "Some"} experience`);
    add(lead.genuineLeads === "Yes" ? 15 : 0, "Genuine leads only");
    add(lead.status2 === "Worth" ? 20 : lead.status2 === "Ok" ? 10 : 0, `Quality: ${lead.status2}`);
    // 20 prio + 10 phone + 15 fill + 15 activity + 20 exp + 15 genuine + 20 quality = 115 → rescale below
    pts = (pts / 115) * 100;
  } else {
    const u = URGENCY[lead.timeline];
    add(u ? u * 30 : 0, `Wants to ${role === "buyer" ? "buy" : "sell"}: ${lead.timeline}`);
    const priced = role === "seller"
      ? lead.exactPrice || lead.budgetValue || lead.expectedPrice
      : lead.budgetValue || lead.budget;
    add(priced ? 10 : 0, "Budget / price stated");
  }

  if (isOverdue(role, lead)) pts -= 8;
  if ((lead.status || "New") === "New" && idle > 14) pts -= 8;

  const score = Math.max(0, Math.min(100, Math.round(pts)));
  const tier = score >= 70 ? "Hot" : score >= 45 ? "Warm" : "Cold";
  return { score, tier, color: TIERS[tier], reasons: reasons.sort((a, b) => b.pts - a.pts).slice(0, 4) };
}

// ---------- follow-up queue ----------

export function buildTasks(data) {
  const tasks = [];
  ["seller", "buyer", "mediator"].forEach((role) => {
    (data[role] || []).forEach((lead) => {
      if (isClosed(role, lead)) return;
      const s = leadScore(role, lead);
      const due = parseDay(lead.followUpDate);
      const diff = due ? dayDiff(due) : null;
      const idle = daysSince(lastActivity(lead));
      let bucket = null;
      if (diff !== null) {
        if (diff < 0) bucket = "overdue";
        else if (diff === 0) bucket = "today";
        else if (diff <= 3) bucket = "soon";
      } else if (s.score >= 55 || idle >= 7) {
        bucket = "needsDate";
      }
      if (bucket) tasks.push({ key: `${role}-${lead.id}`, role, lead, score: s, diff, idle, bucket });
    });
  });
  tasks.sort((a, b) => (a.diff ?? 99) - (b.diff ?? 99) || b.score.score - a.score.score);
  return tasks;
}

// ---------- buyer ↔ property matching ----------

const TYPE_GROUP = {
  "Home / Independent House": "house",
  Villa: "house",
  "Apartment / Flat": "flat",
  "Plot / Land": "land",
  Hotel: "commercial",
  Restaurant: "commercial",
  Saloon: "commercial",
  "Shop / Retail": "commercial",
  "Office / Commercial Space": "commercial",
};

// Rough Chennai locality → region guess so a buyer's "North Chennai" can be
// compared with a seller's free-text location. Heuristic only — it is
// labelled as a guess in the UI, and an admin-set `area` always wins.
const REGION_WORDS = {
  "North Chennai": ["tondiarpet", "royapuram", "washermanpet", "perambur", "kolathur", "madhavaram", "tiruvottiyur", "thiruvottiyur", "manali", "red hills", "vyasarpadi", "basin bridge", "sowcarpet", "george town", "ennore", "ambattur", "avadi", "padi", "mogappair", "villivakkam", "korattur", "north"],
  "Central Chennai": ["t nagar", "t. nagar", "anna nagar", "mylapore", "egmore", "kilpauk", "nungambakkam", "kodambakkam", "vadapalani", "aminjikarai", "purasaiwakkam", "choolaimedu", "saidapet", "ashok nagar", "alwarpet", "teynampet", "central"],
  "South Chennai": ["adyar", "velachery", "tambaram", "medavakkam", "sholinganallur", "omr", "pallikaranai", "guindy", "chromepet", "pallavaram", "perungudi", "thoraipakkam", "madipakkam", "nanganallur", "besant nagar", "ecr", "siruseri", "navalur", "kelambakkam", "south"],
};

export function regionOf(text) {
  const t = String(text || "").toLowerCase();
  if (!t) return "";
  for (const [region, words] of Object.entries(REGION_WORDS)) {
    if (words.some((w) => t.includes(w))) return region;
  }
  return "";
}

function sellerRange(l) {
  const exact = num(l.exactPrice);
  const bv = num(l.budgetValue);
  const point = isFinite(exact) && exact > 0 ? exact : isFinite(bv) && bv > 0 ? bv : NaN;
  if (isFinite(point)) return [point * 0.9, point * 1.1];
  return PRICE_BANDS[l.expectedPrice] || null;
}

function buyerRange(l) {
  const bv = num(l.budgetValue);
  if (isFinite(bv) && bv > 0) return [0, bv * 1.1];
  const band = PRICE_BANDS[l.budget];
  return band ? [band[0], band[1] * 1.1] : null;
}

/** 0–100 match between one buyer and one seller property, with reasons. */
export function scoreMatch(buyer, seller) {
  const reasons = [];
  let score = 0;

  // Property type (35)
  if (buyer.propertyType && seller.propertyType) {
    if (buyer.propertyType === seller.propertyType) {
      score += 35;
      reasons.push({ ok: true, text: `Same type: ${seller.propertyType}` });
    } else if (TYPE_GROUP[buyer.propertyType] && TYPE_GROUP[buyer.propertyType] === TYPE_GROUP[seller.propertyType]) {
      score += 20;
      reasons.push({ ok: true, text: `Similar type: ${seller.propertyType}` });
    } else {
      reasons.push({ ok: false, text: `Wants ${buyer.propertyType}, this is ${seller.propertyType}` });
    }
  }

  // Budget (30)
  const br = buyerRange(buyer);
  const sr = sellerRange(seller);
  if (br && sr) {
    if (br[0] <= sr[1] && sr[0] <= br[1]) {
      score += 30;
      reasons.push({ ok: true, text: "Budget fits the asking price" });
    } else {
      const gap = sr[0] > br[1] ? sr[0] - br[1] : br[0] - sr[1];
      const ref = Math.max(br[1], sr[1]);
      if (isFinite(ref) && gap / ref < 0.2) {
        score += 12;
        reasons.push({ ok: false, text: "Budget is close — a little negotiation" });
      } else {
        reasons.push({ ok: false, text: "Budget is far from the asking price" });
      }
    }
  }

  // Location (20)
  const sellerText = `${seller.area || ""} ${seller.propertyLocation || ""}`.trim();
  const sellerRegion = regionOf(seller.area) || regionOf(seller.propertyLocation);
  const pref = buyer.preferredLocation;
  if (buyer.area && sellerText.toLowerCase().includes(String(buyer.area).toLowerCase())) {
    score += 20;
    reasons.push({ ok: true, text: `In ${buyer.area}` });
  } else if (!pref || pref === "No Specific Preference") {
    score += 12;
    reasons.push({ ok: true, text: "Buyer is flexible on location" });
  } else if (sellerRegion && sellerRegion === pref) {
    score += 20;
    reasons.push({ ok: true, text: `${pref} (matches ${seller.propertyLocation || seller.area})` });
  } else if (sellerRegion) {
    reasons.push({ ok: false, text: `Wants ${pref}, property is in ${sellerRegion}` });
  } else {
    score += 6;
    reasons.push({ ok: false, text: "Location can't be compared yet — set the lead's area" });
  }

  // Both ready soon (15)
  const bu = URGENCY[buyer.timeline] || 0;
  const su = URGENCY[seller.timeline] || 0;
  if (bu || su) {
    const t = (bu * 8 + su * 7);
    score += t;
    if (bu >= 0.75 && su >= 0.45) reasons.push({ ok: true, text: "Both sides ready to move soon" });
  }

  return { score: Math.round(Math.min(100, score)), reasons };
}

export function matchesForBuyer(buyer, sellers, limit = 6) {
  return sellers
    .filter((s) => !isClosed("seller", s))
    .map((s) => ({ lead: s, ...scoreMatch(buyer, s) }))
    .filter((m) => m.score >= 35)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function matchesForSeller(seller, buyers, limit = 6) {
  return buyers
    .filter((b) => !isClosed("buyer", b))
    .map((b) => ({ lead: b, ...scoreMatch(b, seller) }))
    .filter((m) => m.score >= 35)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ---------- WhatsApp templates ----------

const first = (name) => String(name || "").trim().split(/\s+/)[0] || "there";

export function templatesFor(role, lead, adminName = "") {
  const hi = `Hi ${first(lead.name)}`;
  const sign = `\n\n— ${adminName || "Middle Class Mediator"}`;
  const where = lead.area || lead.propertyLocation || lead.preferredLocation || "your area";

  if (role === "seller") {
    const list = [
      { id: "intro", label: "Follow-up", text: `${hi}, this is regarding your ${lead.propertyType || "property"} in ${where} that you registered with us. Is it still available? Happy to help you find the right buyer.${sign}` },
      { id: "price", label: "Price check", text: `${hi}, we have genuine buyers asking about properties like yours in ${where}. Could you confirm your best expected price so we can shortlist the right ones?${sign}` },
      { id: "visit", label: "Site visit", text: `${hi}, can we schedule a quick site visit for your ${lead.propertyType || "property"}? Please let us know a convenient day and time.${sign}` },
    ];
    if (String(lead.photosShared || "").toLowerCase().includes("later")) {
      list.unshift({ id: "photos", label: "Ask for photos", text: `${hi}, to list your property in ${where} we just need a few clear photos / a short video. Could you send them here when you get a moment?${sign}` });
    }
    return list;
  }

  if (role === "buyer") {
    return [
      { id: "intro", label: "Follow-up", text: `${hi}, following up on your search for a ${lead.propertyType || "property"} in ${lead.preferredLocation || "Chennai"}${lead.budget ? ` (${lead.budget})` : ""}. Are you still looking? I have a few options to share.${sign}` },
      { id: "options", label: "Share options", text: `${hi}, I have a few properties that match your requirement. Shall I send the photos and details?${sign}` },
      { id: "visit", label: "Site visit", text: `${hi}, would you like to visit a couple of shortlisted properties this week? Tell me a day that suits you.${sign}` },
      { id: "loan", label: "Loan help", text: `${hi}, if you need a home loan I can connect you with a bank executive who can check your eligibility quickly.${sign}` },
    ];
  }

  return [
    { id: "welcome", label: "Welcome", text: `${hi}, welcome to the Middle Class Mediator network! Please share your active listings and requirements and we'll start matching.${sign}` },
    { id: "leads", label: "Share leads", text: `${hi}, do you have any genuine buyers or sellers for ${lead.propertyCategory || "properties"} in ${lead.workingArea || "Chennai"} right now? Let's work a deal together.${sign}` },
  ];
}

// ---------- overview analytics ----------

const dayKey = (d) => toISODate(d);

function intake(data, days) {
  const buckets = [];
  const index = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = startOfToday();
    d.setDate(d.getDate() - i);
    const b = { key: dayKey(d), date: d, seller: 0, buyer: 0, mediator: 0, total: 0 };
    index[b.key] = b;
    buckets.push(b);
  }
  ["seller", "buyer", "mediator"].forEach((role) => {
    (data[role] || []).forEach((l) => {
      const t = new Date(l.timestamp);
      if (isNaN(t)) return;
      const b = index[dayKey(t)];
      if (b) {
        b[role] += 1;
        b.total += 1;
      }
    });
  });
  return buckets;
}

function countBy(list, getKey) {
  const out = {};
  list.forEach((l) => {
    const k = getKey(l);
    if (k) out[k] = (out[k] || 0) + 1;
  });
  return out;
}

export const BUDGET_ORDER = Object.keys(PRICE_BANDS);

export function computeOverview(data, statusesByRole) {
  const sellers = data.seller || [];
  const buyers = data.buyer || [];
  const mediators = data.mediator || [];
  const all = [
    ...sellers.map((l) => ({ role: "seller", l })),
    ...buyers.map((l) => ({ role: "buyer", l })),
    ...mediators.map((l) => ({ role: "mediator", l })),
  ];

  const within = (l, fromDays, toDays) => {
    const t = new Date(l.timestamp).getTime();
    if (isNaN(t)) return false;
    const age = (Date.now() - t) / DAY;
    return age >= fromDays && age < toDays;
  };
  const newThisWeek = all.filter((x) => within(x.l, 0, 7)).length;
  const newLastWeek = all.filter((x) => within(x.l, 7, 14)).length;

  const scored = all
    .filter((x) => !isClosed(x.role, x.l))
    .map((x) => ({ ...x, s: leadScore(x.role, x.l) }));
  const hot = scored.filter((x) => x.s.tier === "Hot" && x.role !== "mediator").sort((a, b) => b.s.score - a.s.score);

  const tasks = buildTasks(data);
  const overdue = tasks.filter((t) => t.bucket === "overdue").length;
  const dueToday = tasks.filter((t) => t.bucket === "today").length;

  const funnel = {};
  ["seller", "buyer", "mediator"].forEach((role) => {
    const statuses = statusesByRole[role] || [];
    const counts = countBy(data[role] || [], (l) => l.status || statuses[0]);
    funnel[role] = statuses.map((s) => ({ label: s, count: counts[s] || 0 }));
  });

  const typeDemand = countBy(buyers.filter((b) => !isClosed("buyer", b)), (b) => b.propertyType);
  const typeSupply = countBy(sellers.filter((s) => !isClosed("seller", s)), (s) => s.propertyType);
  const types = [...new Set([...Object.keys(typeDemand), ...Object.keys(typeSupply)])]
    .map((t) => ({ label: t, demand: typeDemand[t] || 0, supply: typeSupply[t] || 0 }))
    .sort((a, b) => b.demand + b.supply - (a.demand + a.supply))
    .slice(0, 6);

  const bDemand = countBy(buyers.filter((b) => !isClosed("buyer", b)), (b) => b.budget);
  const bSupply = countBy(sellers.filter((s) => !isClosed("seller", s)), (s) => {
    const p = sellerRange(s);
    if (!p) return "";
    const mid = p[1] === Infinity ? p[0] : (p[0] + p[1]) / 2;
    return BUDGET_ORDER.find((k) => mid >= PRICE_BANDS[k][0] && mid < PRICE_BANDS[k][1]) || "";
  });
  const budgets = BUDGET_ORDER.map((k) => ({ label: k, demand: bDemand[k] || 0, supply: bSupply[k] || 0 }));

  const rDemand = countBy(buyers.filter((b) => !isClosed("buyer", b)), (b) => b.preferredLocation || "");
  const rSupply = countBy(sellers.filter((s) => !isClosed("seller", s)), (s) => regionOf(s.area) || regionOf(s.propertyLocation) || "Other");
  const regions = ["North Chennai", "Central Chennai", "South Chennai", "No Specific Preference", "Other"]
    .map((k) => ({ label: k === "No Specific Preference" ? "Flexible" : k.replace(" Chennai", ""), demand: rDemand[k] || 0, supply: rSupply[k] || 0 }))
    .filter((r) => r.demand || r.supply);

  const budgetValues = sellers.map((s) => sellerRange(s)).filter(Boolean).map((r) => (r[1] === Infinity ? r[0] : (r[0] + r[1]) / 2));
  const pipelineValue = budgetValues.reduce((a, b) => a + b, 0);

  const matchedBuyers = buyers.filter((b) => !isClosed("buyer", b) && matchesForBuyer(b, sellers, 1).some((m) => m.score >= 70)).length;

  return {
    totals: { sellers: sellers.length, buyers: buyers.length, mediators: mediators.length, all: all.length },
    newThisWeek,
    newLastWeek,
    hot,
    hotCount: hot.length,
    overdue,
    dueToday,
    tasks,
    intake: intake(data, 14),
    funnel,
    types,
    budgets,
    regions,
    pipelineValue,
    matchedBuyers,
  };
}

// ---------- small display helpers ----------

export function dueLabel(diff) {
  if (diff === null || diff === undefined) return "No date set";
  if (diff < 0) return `${-diff} day${diff === -1 ? "" : "s"} overdue`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due in ${diff} days`;
}

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/** Plain-English reading of a demand-vs-supply table. */
export function gapInsights(rows, noun) {
  const out = [];
  const short = [...rows].filter((r) => r.demand >= 2 && r.demand > r.supply).sort((a, b) => b.demand - b.supply - (a.demand - a.supply))[0];
  if (short) out.push({ tone: "warn", text: `${short.demand} buyers want ${short.label} (${noun}) but only ${short.supply} ${short.supply === 1 ? "seller is" : "sellers are"} listed — go find more sellers there.` });
  const spare = [...rows].filter((r) => r.supply >= 2 && r.supply > r.demand).sort((a, b) => b.supply - b.demand - (a.supply - a.demand))[0];
  if (spare) out.push({ tone: "good", text: `${spare.supply} listings in ${spare.label} but ${spare.demand} ${spare.demand === 1 ? "buyer" : "buyers"} — promote these on Instagram to pull in buyers.` });
  return out;
}
