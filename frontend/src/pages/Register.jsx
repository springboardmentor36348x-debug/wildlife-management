import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { value: "wildlife_researcher", label: "Wildlife Researcher" },
  { value: "conservation_officer", label: "Conservation Officer" },
  { value: "forest_department_officer", label: "Forest Department Officer" },
  { value: "administrator", label: "Administrator" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    organization: "",
    role: "wildlife_researcher",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 wildlife-bg">
      <div className="bg-white/95 backdrop-blur shadow-2xl ring-1 ring-amber-200/60 rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-forest-700 mb-1">🐾 Create an Account</h1>
        <p className="text-gray-500 mb-6 text-sm">Join the Wildlife Population Intelligence System</p>

        {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              required
              className="w-full border rounded px-3 py-2"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full border rounded px-3 py-2"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              className="w-full border rounded px-3 py-2"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Organization</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-forest-600 hover:bg-forest-700 text-white py-2 rounded font-medium transition disabled:opacity-50"
          >
            {submitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-forest-600 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
