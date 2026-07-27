import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CRMBoard from "../components/admin/CRMBoard";
import PropertiesTab from "../components/admin/PropertiesTab";
import { adminListMediators, adminListSellers, adminListBuyers } from "../lib/api";

const CRM_CONFIG = {
  seller: {
    label: "Seller",
    accent: "#1F6F5C",
    sheet: "Sellers",
    fetcher: adminListSellers,
    fields: [
      ["propertyType", "Property type"],
      ["propertyLocation", "Location"],
      ["propertyStatus", "Status"],
      ["expectedPrice", "Expected price"],
      ["ownership", "Ownership"],
      ["timeline", "Planning to sell"],
    ],
  },
  buyer: {
    label: "Buyer",
    accent: "#B5533C",
    sheet: "Buyers",
    fetcher: adminListBuyers,
    fields: [
      ["propertyType", "Property type"],
      ["purpose", "Purpose"],
      ["budget", "Budget"],
      ["preferredLocation", "Preferred location"],
      ["loanRequirement", "Loan requirement"],
      ["timeline", "Planning to buy"],
    ],
  },
  mediator: {
    label: "Mediator",
    accent: "#2D4373",
    sheet: "Mediators",
    fetcher: adminListMediators,
    fields: [
      ["profession", "Profession"],
      ["workingArea", "Working area"],
      ["propertyCategory", "Category"],
      ["experience", "Experience"],
      ["dealType", "Deal type"],
      ["genuineLeads", "Genuine leads only"],
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
  const navigate = useNavigate();

  useEffect(() => {
    const pw = sessionStorage.getItem("mcm_admin_pw");
    if (!pw) {
      navigate("/control");
      return;
    }
    setPassword(pw);
  }, [navigate]);

  function logout() {
    sessionStorage.removeItem("mcm_admin_pw");
    navigate("/control");
  }

  if (!password) return null;

  const active = CRM_CONFIG[tab];

  return (
    <div className="max-w-6xl mx-auto px-5 pb-28 lg:pb-20">
      <div className="pt-10 pb-6 flex items-center justify-between">
        <div>
          <p className="field-label mb-0.5">Admin · hidden control room</p>
          <h1 className="font-display font-semibold text-2xl text-ink">Command Center</h1>
        </div>
        <button onClick={logout} className="text-xs uppercase tracking-wide font-semibold text-ink/50 hover:text-ink">
          Log out
        </button>
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
          password={password}
        />
      )}
      {tab === "properties" && <PropertiesTab password={password} />}
    </div>
  );
}
