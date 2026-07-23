import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LeadsTab from "../components/admin/LeadsTab";
import PropertiesTab from "../components/admin/PropertiesTab";

const TABS = [
  { key: "mediator", label: "Mediator leads" },
  { key: "seller", label: "Seller leads" },
  { key: "buyer", label: "Buyer leads" },
  { key: "properties", label: "Published listings" },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("mediator");
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

  return (
    <div className="max-w-4xl mx-auto px-5 pb-20">
      <div className="pt-10 pb-6 flex items-center justify-between">
        <div>
          <p className="field-label mb-0.5">Admin</p>
          <h1 className="font-display font-semibold text-2xl text-ink">Dashboard</h1>
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

      {tab === "mediator" && <LeadsTab type="mediator" password={password} />}
      {tab === "seller" && <LeadsTab type="seller" password={password} />}
      {tab === "buyer" && <LeadsTab type="buyer" password={password} />}
      {tab === "properties" && <PropertiesTab password={password} />}
    </div>
  );
}
