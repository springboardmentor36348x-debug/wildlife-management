import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/common/Button";

const roles = [
  { value: "researcher", label: "Wildlife Researcher" },
  { value: "conservation", label: "Conservation Officer" },
  { value: "forest", label: "Forest Department Officer" },
  { value: "administrator", label: "Administrator" },
];

// Field-map pins: real-feeling camera trap site codes, plotted at fixed
// positions to form the left panel's signature visual.
const sitePins = [
  { id: "CT-014", x: 22, y: 30 },
  { id: "CT-027", x: 58, y: 18 },
  { id: "CT-031", x: 78, y: 42 },
  { id: "CT-009", x: 40, y: 58 },
  { id: "CT-042", x: 65, y: 72 },
  { id: "CT-018", x: 15, y: 68 },
];

const routes = [
  [0, 1], [1, 2], [0, 3], [3, 4], [3, 5],
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "researcher",
    organization: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      // ----------------------------------------------------
      // LocalStorage Save Logic (Until Day 6 Backend API)
      // ----------------------------------------------------
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const userExists = existingUsers.some((u) => u.email === form.email);

      if (userExists) {
        setError("User with this email already exists!");
        setLoading(false);
        return;
      }

      // Naya user list me add karke Save kar lo
      const updatedUsers = [...existingUsers, { email: form.email, name: form.name, role: form.role }];
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      // ----------------------------------------------------

      navigate("/login");
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — field map signature visual */}
      <div className="hidden lg:flex lg:w-[42%] bg-pine-900 relative overflow-hidden flex-col justify-between p-12">
        <div className="relative z-10">
          <div className="text-sand-100 text-xs tracking-[0.2em] uppercase opacity-60 mb-3">
            Wildlife Population Intelligence
          </div>
          <h1 className="font-display text-sand-100 text-4xl leading-tight max-w-sm">
            Every camera trap tells a story.
          </h1>
          <p className="text-sand-100/60 text-sm mt-4 max-w-xs leading-relaxed">
            Join the researchers, rangers, and officers tracking species,
            habitats, and populations across active monitoring sites.
          </p>
        </div>

        {/* SVG field map */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full opacity-90"
          preserveAspectRatio="none"
        >
          {routes.map(([a, b], i) => (
            <line
              key={i}
              x1={sitePins[a].x}
              y1={sitePins[a].y}
              x2={sitePins[b].x}
              y2={sitePins[b].y}
              stroke="#4A7C59"
              strokeWidth="0.3"
              strokeDasharray="1.2 1.2"
              opacity="0.5"
            />
          ))}
          {sitePins.map((p) => (
            <circle key={p.id} cx={p.x} cy={p.y} r="1" fill="#5B8266" />
          ))}
        </svg>

        <div className="relative z-10 flex flex-wrap gap-x-6 gap-y-2">
          {sitePins.map((p) => (
            <span key={p.id} className="text-sand-100/40 text-[11px] font-mono">
              {p.id}
            </span>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-sand-100">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-display text-2xl text-bark">Create your account</h2>
            <p className="text-sm text-bark/60 mt-1">
              Already registered?{" "}
              <Link to="/login" className="text-moss-600 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-bark/70 mb-1.5">
                Full name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Enter User Name"
                className="w-full px-3.5 py-2.5 rounded-lg border border-sand-300 bg-white text-sm text-bark
                           focus:outline-none focus:ring-2 focus:ring-moss-500/40 focus:border-moss-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-bark/70 mb-1.5">
                Work email
              </label>
              <input
                type="text"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="Enter Email Address"
                className="w-full px-3.5 py-2.5 rounded-lg border border-sand-300 bg-white text-sm text-bark
                           focus:outline-none focus:ring-2 focus:ring-moss-500/40 focus:border-moss-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-bark/70 mb-1.5">
                Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-sand-300 bg-white text-sm text-bark
                           focus:outline-none focus:ring-2 focus:ring-moss-500/40 focus:border-moss-500"
              >
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-bark/70 mb-1.5">
                Organization / Forest Division
              </label>
              <input
                name="organization"
                value={form.organization}
                onChange={handleChange}
                placeholder="Kanha Tiger Reserve"
                className="w-full px-3.5 py-2.5 rounded-lg border border-sand-300 bg-white text-sm text-bark
                           focus:outline-none focus:ring-2 focus:ring-moss-500/40 focus:border-moss-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-bark/70 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-sand-300 bg-white text-sm text-bark
                             focus:outline-none focus:ring-2 focus:ring-moss-500/40 focus:border-moss-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-bark/70 mb-1.5">
                  Confirm password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-sand-300 bg-white text-sm text-bark
                             focus:outline-none focus:ring-2 focus:ring-moss-500/40 focus:border-moss-500"
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-rust-500 bg-rust-500/10 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth disabled={loading} className="mt-2">
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="text-[11px] text-bark/40 mt-6 leading-relaxed">
            By creating an account you agree to follow field data protocols for
            camera trap, audio sensor, and survey uploads.
          </p>
        </div>
      </div>
    </div>
  );
}