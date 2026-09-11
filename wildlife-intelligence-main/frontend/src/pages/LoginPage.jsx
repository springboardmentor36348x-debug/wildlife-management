import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">🌍</div>
          <h1>WildlifeOS</h1>
          <p>AI-Powered Population Intelligence</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@wildlife.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ width: "100%", marginTop: "0.5rem" }}
          >
            {loading ? <><span className="spinner"></span> Signing in…</> : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </div>

        <div style={{ marginTop: "1.5rem", padding: "0.85rem", background: "rgba(124,58,237,0.06)", borderRadius: "var(--radius-md)", border: "1px solid rgba(124,58,237,0.15)" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent-purple-light)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Demo Credentials</p>
          <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.8, fontFamily: "var(--font-mono)" }}>
            <div>admin@wildlife.org / Admin@12345</div>
            <div>researcher@wildlife.org / Research@12345</div>
            <div>officer@wildlife.org / Officer@12345</div>
            <div>forest@wildlife.org / Forest@12345</div>
          </div>
        </div>
      </div>
    </div>
  );
}
