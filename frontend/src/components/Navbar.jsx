import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { to: "/", label: "Dashboard" },
  { to: "/live-map", label: "🔴 Live Map" },
  { to: "/monitoring-sites", label: "Monitoring Sites" },
  { to: "/surveys", label: "Surveys" },
  { to: "/upload", label: "Upload Image/Audio" },
  { to: "/species", label: "Species Observations" },
  { to: "/biodiversity", label: "Biodiversity Analytics" },
  { to: "/population-habitat", label: "Population & Habitat" },
  { to: "/conservation", label: "Conservation" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="bg-forest-700 text-white px-6 py-3 flex items-center justify-between shadow">
      <div className="flex items-center gap-6">
        <span className="font-bold text-lg">🦁 Wildlife Intelligence</span>
        <div className="hidden md:flex gap-4 text-sm">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="hover:text-forest-100 transition">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="opacity-80">
          {user.full_name} · <span className="capitalize">{user.role.replaceAll("_", " ")}</span>
        </span>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="bg-forest-600 hover:bg-forest-500 px-3 py-1 rounded transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
