import { Compass, Ruler, Car, CalendarClock, BadgeCheck, Building2, House, Tag } from "lucide-react";

// ---------------------------------------------------------------- parsing

function parseJson(text, fallback) {
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export function parseImageList(p) {
  const parsed = parseJson(p.images, []);
  let urls = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  if (urls.length === 0 && p.imageUrl) urls = [p.imageUrl];
  return urls;
}

export function parseAttributes(p) {
  const parsed = parseJson(p.attributes, {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

export const isSold = (p) => p.soldOut === "true" || p.soldOut === true;

/**
 * Reads the first amount out of a free-text price: "₹50,00,000" → 5,000,000,
 * "₹75 Lakhs–₹1 Crore" → 7,500,000 (the first figure, with ITS unit).
 */
export function priceValue(price) {
  if (!price) return null;
  const m = String(price).toLowerCase().match(/(\d[\d,]*\.?\d*)\s*(crores?|cr\b|lakhs?|l\b)?/);
  if (!m) return null;
  const num = parseFloat(m[1].replace(/,/g, ""));
  if (Number.isNaN(num)) return null;
  const unit = m[2] || "";
  if (unit.startsWith("cr")) return num * 10000000;
  if (unit.startsWith("l")) return num * 100000;
  return num;
}

/** One tidy object per listing, so every page reads the data the same way. */
export function normalize(p) {
  const attrs = parseAttributes(p);
  const sqft = Number(String(p.sqft || "").replace(/[^\d.]/g, "")) || null;
  const location = p.location || "";
  return {
    id: p.id,
    title: p.title || "Property",
    type: p.type || "",
    location,
    area: location.split(",")[0].trim(),
    price: p.price || "",
    priceNum: priceValue(p.price),
    sqft,
    facing: attrs.Facing || attrs.facing || "",
    attrs,
    images: parseImageList(p),
    sold: isSold(p),
    description: p.description || "",
    sellerNote: p.sellerNote || "",
    refId: p.refId || "",
  };
}

// ---------------------------------------------------------------- types

const SHORT_TYPE = {
  "Home / Independent House": "Independent House",
  "Apartment / Flat": "Apartment",
  "Plot / Land": "Plot",
  "Land / Plot": "Plot",
  "Shop / Retail": "Shop",
  "Office / Commercial Space": "Office",
};
export const shortType = (t) => SHORT_TYPE[t] || t;

/** Which icon family a property type belongs to. */
export function typeKind(t) {
  const x = (t || "").toLowerCase();
  if (/apartment|flat/.test(x)) return "apartment";
  if (/plot|land/.test(x)) return "plot";
  if (/shop|retail|office|commercial|hotel|restaurant|saloon/.test(x)) return "commercial";
  return "house";
}

// ---------------------------------------------------------------- specs row

const EXTRA_SPEC_KEYS = [
  ["Building type", Building2],
  ["Parking", Car],
  ["Property age", CalendarClock],
  ["Property usage", House],
  ["Approval status", BadgeCheck],
  ["Purpose", Tag],
];

/**
 * The three small facts shown under a listing (the mockup's "3 BHK / 2400
 * Sq.Ft / East Facing" row). Built only from what the listing really has,
 * so a listing with less data simply shows fewer.
 */
export function specsFor(l) {
  const specs = [];
  for (const [key, icon] of EXTRA_SPEC_KEYS) {
    if (l.attrs[key]) {
      specs.push({ icon, text: String(l.attrs[key]) });
      break;
    }
  }
  if (l.sqft) specs.push({ icon: Ruler, text: `${l.sqft.toLocaleString("en-IN")} Sq.ft` });
  if (l.facing) specs.push({ icon: Compass, text: `${l.facing} Facing` });
  return specs.slice(0, 3);
}

// ---------------------------------------------------------------- filters

export const PRICE_STEPS = [
  { v: 2000000, label: "₹ 20 Lakhs" },
  { v: 3000000, label: "₹ 30 Lakhs" },
  { v: 5000000, label: "₹ 50 Lakhs" },
  { v: 7500000, label: "₹ 75 Lakhs" },
  { v: 10000000, label: "₹ 1 Crore" },
  { v: 20000000, label: "₹ 2 Crores" },
  { v: 30000000, label: "₹ 3 Crores" },
  { v: 50000000, label: "₹ 5+ Crores" },
];
export const SQFT_STEPS = [500, 1000, 1500, 2000, 3000, 4000, 5000];
export const FACINGS = ["All", "North", "South", "East", "West"];

export const DEFAULT_FILTERS = {
  type: "All",
  area: "All",
  priceLo: 0,
  priceHi: PRICE_STEPS.length - 1,
  sqftLo: 0,
  sqftHi: SQFT_STEPS.length - 1,
  facing: "All",
};

/** How many sheet filters (not search) differ from their defaults. */
export function activeFilterCount(f) {
  let n = 0;
  if (f.type !== "All") n += 1;
  if (f.area !== "All") n += 1;
  if (f.priceLo !== DEFAULT_FILTERS.priceLo || f.priceHi !== DEFAULT_FILTERS.priceHi) n += 1;
  if (f.sqftLo !== DEFAULT_FILTERS.sqftLo || f.sqftHi !== DEFAULT_FILTERS.sqftHi) n += 1;
  if (f.facing !== "All") n += 1;
  return n;
}

export function applyFilters(list, f, query, savedOnly, isSaved) {
  const q = query.trim().toLowerCase();
  const priceTouched = f.priceLo !== DEFAULT_FILTERS.priceLo || f.priceHi !== DEFAULT_FILTERS.priceHi;
  const sqftTouched = f.sqftLo !== DEFAULT_FILTERS.sqftLo || f.sqftHi !== DEFAULT_FILTERS.sqftHi;
  return list.filter((l) => {
    if (q && !(l.title.toLowerCase().includes(q) || l.location.toLowerCase().includes(q) || l.type.toLowerCase().includes(q))) return false;
    if (savedOnly && !isSaved(l.id)) return false;
    if (f.type !== "All" && l.type !== f.type) return false;
    if (f.area !== "All" && l.area !== f.area) return false;
    if (f.facing !== "All" && l.facing.toLowerCase() !== f.facing.toLowerCase()) return false;
    if (priceTouched) {
      if (l.priceNum === null) return false;
      if (f.priceLo > 0 && l.priceNum < PRICE_STEPS[f.priceLo].v) return false;
      if (f.priceHi < PRICE_STEPS.length - 1 && l.priceNum > PRICE_STEPS[f.priceHi].v) return false;
    }
    if (sqftTouched) {
      if (l.sqft === null) return false;
      if (f.sqftLo > 0 && l.sqft < SQFT_STEPS[f.sqftLo]) return false;
      if (f.sqftHi < SQFT_STEPS.length - 1 && l.sqft > SQFT_STEPS[f.sqftHi]) return false;
    }
    return true;
  });
}

export function sortListings(list, sort) {
  if (sort !== "price-low" && sort !== "price-high") return list;
  return [...list].sort((a, b) => {
    if (a.priceNum === null && b.priceNum === null) return 0;
    if (a.priceNum === null) return 1;
    if (b.priceNum === null) return -1;
    return sort === "price-low" ? a.priceNum - b.priceNum : b.priceNum - a.priceNum;
  });
}
