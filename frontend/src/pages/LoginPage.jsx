import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canopy-950 px-4 relative overflow-hidden">
      {/* Decorative layered "forest at dusk" background - pure CSS/SVG, no external assets */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(45,106,79,0.35), transparent), " +
              "linear-gradient(180deg, #0b201a 0%, #14342a 55%, #0b201a 100%)",
          }}
        />
        {/* Tree-line silhouette */}
        <svg
          className="absolute bottom-0 left-0 w-full opacity-40"
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <path
            d="M0,200 L0,120 L40,60 L60,100 L90,40 L120,110 L150,70 L170,120 L200,50 L230,120 L260,90 L290,130 L320,60 L350,120 L380,80 L410,130 L440,90 L470,140 L500,70 L530,130 L560,100 L590,150 L620,80 L650,140 L680,110 L710,150 L740,90 L770,140 L800,120 L830,160 L860,100 L890,150 L920,130 L950,160 L980,110 L1010,150 L1040,130 L1070,160 L1100,120 L1130,150 L1160,140 L1200,150 L1200,200 Z"
            fill="#0b201a"
          />
        </svg>
        {/* Contour rings motif, echoing the app icon */}
        <svg className="absolute top-10 right-10 opacity-20" width="220" height="220" viewBox="0 0 220 220">
          <circle cx="110" cy="110" r="100" stroke="#d8a441" strokeWidth="1" fill="none" />
          <circle cx="110" cy="110" r="70" stroke="#d8a441" strokeWidth="1" fill="none" />
          <circle cx="110" cy="110" r="40" stroke="#d8a441" strokeWidth="1" fill="none" />
        </svg>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-ochre-400/20 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#d8a441" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="6" stroke="#d8a441" strokeWidth="1.2" opacity="0.7" />
              <circle cx="12" cy="12" r="1.6" fill="#d8a441" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-semibold text-white">
            Wildlife Population Intelligence
          </h1>
          <p className="text-canopy-300 text-sm mt-1">Sign in to your conservation dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@organization.org"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-canopy-300 mt-4">
          New here?{" "}
          <Link to="/register" className="text-ochre-400 font-medium hover:underline">
            Create an account
          </Link>
        </p>

        <div className="mt-6 text-xs text-canopy-400 text-center leading-relaxed">
          Demo logins (seeded): admin@wildlife.org / Admin@12345 · researcher@wildlife.org / Research@12345
          <br />officer@wildlife.org / Officer@12345 · forest@wildlife.org / Forest@12345
        </div>
      </div>
    </div>
  );
}
