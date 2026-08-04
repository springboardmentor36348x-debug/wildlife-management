import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { TreePine, Lock, Mail, ArrowRight, UserPlus } from "lucide-react";

// Theme Palette (Matching your Register & Dashboard design tokens)
const palette = {
  pine: "#0F241E",
  moss: "#5B8266",
  sand: "#F3EFE4",
  sandDark: "#E4DFCF",
  bark: "#3A2E27",
  slate: "#6B6B63",
  rust: "#B4442E",
};

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isNotRegistered, setIsNotRegistered] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
    if (isNotRegistered) setIsNotRegistered(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsNotRegistered(false);

    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      // LocalStorage se check karenge ki user registered hai ya nahi (Frontend Demo Validation)
      const registeredUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const userExists = registeredUsers.some(
        (u) => u.email.toLowerCase() === form.email.toLowerCase()
      );

      // Agar localStorage empty bhi ho tab bhi hum basic validation response trigger karenge
      if (!userExists && registeredUsers.length > 0) {
        setIsNotRegistered(true);
        setError("Account not found. Please register to get access.");
        return;
      }

      // Successful Login Redirect
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: palette.sand, fontFamily: "system-ui, sans-serif" }}
    >
      {/* Left Panel — Matches Register Screen Layout */}
      <div
        className="hidden lg:flex lg:w-[42%] relative overflow-hidden flex-col justify-between p-12"
        style={{ backgroundColor: palette.pine, color: "#EDEFE9" }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <TreePine size={28} color={palette.moss} />
            <span className="text-xs tracking-[0.2em] uppercase opacity-70 font-semibold">
              Wildlife Intelligence
            </span>
          </div>

          <h1 className="text-4xl leading-tight font-serif max-w-sm mb-4">
            Welcome back to the field.
          </h1>
          <p className="text-sm opacity-70 max-w-xs leading-relaxed">
            Access active camera trap feeds, species classification logs, and ecological metrics.
          </p>
        </div>

        {/* Quote Block — Exact Same as Register Screen */}
        <div className="relative z-10 p-6 rounded-2xl border border-[#1E4038] bg-[#16302A]/50 backdrop-blur-sm max-w-xs">
          <div className="text-3xl leading-none font-serif opacity-40 mb-2">“</div>
          <p className="text-xs leading-relaxed opacity-80 mb-3">
            Modernizing species monitoring with AI-driven visual & acoustic tracking.
          </p>
          <div className="text-[11px] font-semibold tracking-wider uppercase opacity-50">
            System Platform v1.0
          </div>
        </div>

        <div className="relative z-10 text-[11px] opacity-40">
          Wildlife Population Intelligence System · v1.0
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold" style={{ color: palette.bark }}>
              Sign in to your account
            </h2>
            <p className="text-sm mt-1" style={{ color: palette.slate }}>
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium hover:underline"
                style={{ color: palette.moss }}
              >
                Register here
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: palette.bark }}>
                Work Email
              </label>
              <div className="relative flex items-center">
                <Mail
                  size={16}
                  className="absolute left-3.5 pointer-events-none"
                  style={{ color: palette.slate }}
                />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="officer@forestdept.gov.in"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg text-sm border outline-none transition-all"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderColor: palette.sandDark,
                    color: palette.bark,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-medium" style={{ color: palette.bark }}>
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Contact system administrator to reset password.");
                  }}
                  className="text-xs font-medium hover:underline"
                  style={{ color: palette.slate }}
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative flex items-center">
                <Lock
                  size={16}
                  className="absolute left-3.5 pointer-events-none"
                  style={{ color: palette.slate }}
                />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg text-sm border outline-none transition-all"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderColor: palette.sandDark,
                    color: palette.bark,
                  }}
                />
              </div>
            </div>

            {/* Error Message & Registration Action Prompt */}
            {error && (
              <div
                className="text-xs rounded-lg p-3 font-medium flex flex-col gap-1.5"
                style={{ backgroundColor: `${palette.rust}15`, color: palette.rust }}
              >
                <span>{error}</span>
                {isNotRegistered && (
                  <Link
                    to="/register"
                    className="flex items-center gap-1 text-xs font-bold underline"
                    style={{ color: palette.bark }}
                  >
                    <UserPlus size={14} /> Click here to create an account
                  </Link>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
              style={{
                backgroundColor: palette.moss,
                color: "#0E211B",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Signing in..." : "Sign in to System"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="text-[11px] mt-8 leading-relaxed text-center" style={{ color: palette.slate }}>
            Authorized personnel only. Access to field data and species records is monitored under official environmental guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}