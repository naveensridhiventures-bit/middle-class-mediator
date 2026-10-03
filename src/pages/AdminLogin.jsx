import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../lib/api";
import { COLORS } from "../lib/theme";
import BrandHeader from "../components/wizard/BrandHeader";
import TextField from "../components/wizard/TextField";

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
    } catch {
      setError("Wrong password. Check it and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas sm:py-8">
      <div
        className="mx-auto max-w-md min-h-[100dvh] sm:min-h-0 bg-surface sm:rounded-[2rem] sm:ring-8 sm:ring-[#EDE7DF] sm:shadow-[0_28px_60px_-24px_rgba(27,42,74,0.35)]"
        style={{ "--accent": COLORS.steel }}
      >
        <BrandHeader color={COLORS.steel} className="sm:rounded-t-[2rem]" />
        <form onSubmit={handleSubmit} className="px-5 pt-8 pb-10">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: COLORS.steel }}>
            Admin
          </p>
          <h1 className="mt-2 font-display font-bold text-[1.6rem] leading-tight text-ink">Sign in</h1>
          <p className="mt-2 text-sm text-ink/55">Enter the admin password to open the dashboard.</p>

          <div className="mt-6">
            <TextField
              label="Password"
              required
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="mt-6 w-full h-14 rounded-full bg-ink text-white text-[12px] font-bold uppercase tracking-[0.14em] transition active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none"
          >
            {loading ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
