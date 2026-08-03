import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import CRMBoard from "../components/admin/CRMBoard";
import PropertiesTab from "../components/admin/PropertiesTab";
import { adminListMediators, adminListSellers, adminListBuyers } from "../lib/api";

// Same option lists as the public Seller/Buyer/Mediator forms, so admin
// edits use matching dropdowns instead of free-text and can't drift from
// what the forms actually offer.
const PROPERTY_TYPES = ["Home / Independent House", "Apartment / Flat", "Villa", "Plot / Land", "Hotel", "Restaurant", "Saloon", "Shop / Retail", "Office / Commercial Space"];
const SELLER_LOCATIONS = ["North Chennai", "Central Chennai", "South Chennai", "Other"];
const PROPERTY_STATUS = ["Brand New", "Resale", "Under Construction"];
const PRICE_RANGES = ["Below ₹30 Lakhs", "₹30–50 Lakhs", "₹50–75 Lakhs", "₹75 Lakhs–₹1 Crore", "Above ₹1 Crore"];
const OWNERSHIP = ["Direct Owner", "Authorized Representative", "Builder / Developer"];
const SELL_TIMELINE = ["Immediately", "Within 1 Month", "Within 3 Months", "Just Exploring"];

const PURPOSE = ["Own Use", "Investment"];
const BUDGET = ["Below ₹30 Lakhs", "₹30–50 Lakhs", "₹50–75 Lakhs", "₹75 Lakhs–₹1 Crore", "Above ₹1 Crore"];
const BUYER_LOCATIONS = ["North Chennai", "Central Chennai", "South Chennai", "No Specific Preference"];
const YES_NO = ["Yes", "No"];
const BUY_TIMELINE = ["Immediately", "Within 1 Month", "Within 3 Months", "Just Exploring"];

const PROFESSIONS = ["Mediator", "Real Estate Agent", "Builder", "Developer"];
const MEDIATOR_AREAS = ["North Chennai", "Central Chennai", "South Chennai", "All Over Chennai"];
const CATEGORIES = ["Residential", "Commercial", "Land", "Rental", "All Categories"];
const EXPERIENCE = ["Below 1 Year", "1–3 Years", "3–5 Years", "Above 5 Years"];
const DEAL_TYPES = ["Sale", "Rental", "Lease", "All"];

const CRM_CONFIG = {
  seller: {
    label: "Seller",
    accent: "#1F6F5C",
    sheet: "Sellers",
    fetcher: adminListSellers,
    fields: [
      ["propertyType", "Property type", PROPERTY_TYPES],
      ["propertyLocation", "Location", SELLER_LOCATIONS],
      ["propertyStatus", "Status", PROPERTY_STATUS],
      ["expectedPrice", "Expected price", PRICE_RANGES],
      ["ownership", "Ownership", OWNERSHIP],
      ["timeline", "Planning to sell", SELL_TIMELINE],
    ],
    facetFields: [
      ["propertyType", "Property type"],
      ["propertyStatus", "Property status"],
      ["timeline", "Planning to sell"],
    ],
  },
  buyer: {
    label: "Buyer",
    accent: "#B5533C",
    sheet: "Buyers",
    fetcher: adminListBuyers,
    fields: [
      ["propertyType", "Property type", PROPERTY_TYPES],
      ["purpose", "Purpose", PURPOSE],
      ["budget", "Budget", BUDGET],
      ["preferredLocation", "Preferred location", BUYER_LOCATIONS],
      ["loanRequirement", "Loan requirement", YES_NO],
      ["timeline", "Planning to buy", BUY_TIMELINE],
    ],
    facetFields: [
      ["propertyType", "Property type"],
      ["purpose", "Purpose"],
      ["timeline", "Planning to buy"],
    ],
  },
  mediator: {
    label: "Mediator",
    accent: "#2D4373",
    sheet: "Mediators",
    fetcher: adminListMediators,
    fields: [
      ["profession", "Profession", PROFESSIONS],
      ["workingArea", "Working area", MEDIATOR_AREAS],
      ["propertyCategory", "Category", CATEGORIES],
      ["experience", "Experience", EXPERIENCE],
      ["dealType", "Deal type", DEAL_TYPES],
      ["genuineLeads", "Genuine leads only", YES_NO],
    ],
    facetFields: [
      ["propertyCategory", "Category"],
      ["profession", "Profession"],
      ["dealType", "Deal type"],
    ],
  },
};

const TABS = [
  { key: "seller", label: "Seller CRM" },
  { key: "buyer", label: "Buyer CRM" },
  { key: "mediator", label: "Mediator CRM" },
  { key: "properties", label: "Published listings" },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("seller");
  const [password, setPassword] = useState(null);
  const [adminName, setAdminName] = useState(() => localStorage.getItem("mcm_admin_name") || "");
  const [editingName, setEditingName] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const pw = sessionStorage.getItem("mcm_admin_pw");
    if (!pw) {
      navigate("/control");
      return;
    }
    setPassword(pw);
  }, [navigate]);

  useEffect(() => {
    if (!adminName) setEditingName(true);
  }, [adminName]);

  function saveName(value) {
    const trimmed = value.trim();
    setAdminName(trimmed);
    localStorage.setItem("mcm_admin_name", trimmed);
    setEditingName(false);
  }

  function logout() {
    sessionStorage.removeItem("mcm_admin_pw");
    navigate("/control");
  }

  if (!password) return null;

  const active = CRM_CONFIG[tab];

  return (
    <div className="max-w-6xl mx-auto px-5 pb-28 lg:pb-20">
      <div className="pt-10 pb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="field-label mb-0.5">Admin · hidden control room</p>
          <h1 className="font-display font-semibold text-2xl text-ink">Command Center</h1>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {editingName ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveName(e.target.elements.name.value);
              }}
              className="flex items-center gap-2"
            >
              <input
                name="name"
                autoFocus
                defaultValue={adminName}
                placeholder="Your name (shown on remarks)"
                className="field-input !py-1.5 !px-3 text-xs w-48"
              />
              <button type="submit" className="btn-primary !py-1.5 !px-3 text-xs">Save</button>
            </form>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-xs text-ink/50 hover:text-ink"
              title="Change the name shown on remarks you add"
            >
              Logged in as <span className="font-semibold text-ink/80">{adminName}</span> ✎
            </button>
          )}
          <Link to="/control/field-visit" className="text-xs font-semibold text-ink/50 hover:text-ink">
            📍 Field visit page
          </Link>
          <Link to="/gallery" className="text-xs font-semibold text-ink/50 hover:text-ink">
            🖼 Buyer gallery
          </Link>
          <button onClick={logout} className="text-xs uppercase tracking-wide font-semibold text-ink/50 hover:text-ink">
            Log out
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              tab === t.key ? "bg-ink text-paper" : "bg-white/60 text-ink/60 border border-ink/10 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active && (
        <CRMBoard
          key={tab}
          type={tab}
          label={active.label}
          accent={active.accent}
          sheet={active.sheet}
          fetcher={active.fetcher}
          fields={active.fields}
          facetFields={active.facetFields}
          password={password}
          adminName={adminName}
        />
      )}
      {tab === "properties" && <PropertiesTab password={password} />}
    </div>
  );
}
