import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../lib/api";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await adminLogin(password);
      sessionStorage.setItem("mcm_admin_pw", password);
      navigate("/control/dashboard");
    } catch (err) {
      setError("Wrong password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-5 pt-24">
      <div className="card-ledger p-7">
        <p className="field-label mb-1">Admin</p>
        <h1 className="font-display font-semibold text-2xl text-ink mb-6">Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Password</label>
            <input
              type="password"
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>
          {error && <p className="text-sm text-buyer">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
