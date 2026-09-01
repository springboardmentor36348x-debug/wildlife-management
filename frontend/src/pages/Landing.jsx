import { Link } from "react-router-dom";
import {
  PawPrint,
  Sparkles,
  Radar,
  Leaf,
  ShieldCheck,
  Mail,
  Globe,
  MessageCircle,
} from "lucide-react";
import heroImage from "../assets/hero-forest.png";

const features = [
  { icon: Sparkles, title: "AI-Powered Analysis", desc: "Advanced AI models for species identification and monitoring" },
  { icon: Radar, title: "Real-time Monitoring", desc: "Real-time monitoring and population tracking" },
  { icon: Leaf, title: "Biodiversity Intelligence", desc: "Comprehensive biodiversity insights and analytics" },
  { icon: ShieldCheck, title: "Conservation Focused", desc: "Data-driven insights for better conservation decisions" },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <PawPrint className="text-wild-600" size={22} />
          <span className="font-semibold text-slate-800">Wildlife Intelligence</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="px-4 py-2 text-sm rounded-full border border-wild-600 text-wild-700 hover:bg-wild-50">Login</Link>
          <Link to="/register" className="px-4 py-2 text-sm rounded-full bg-wild-600 text-white hover:bg-wild-700">Register</Link>
        </div>
      </header>

      {/* Hero with background image */}
      <section
        id="home"
        className="relative flex flex-col items-center justify-center text-center px-6 py-32 overflow-hidden"
      >
        <img
          src={heroImage}
          alt="Wildlife forest"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-wild-950/90" />

        <div className="relative z-10 flex flex-col items-center">
          <span className="text-xs uppercase tracking-wide text-wild-200 bg-white/10 backdrop-blur px-3 py-1 rounded-full mb-4">
            AI Powered
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white max-w-2xl drop-shadow-lg">
            Wildlife Population Intelligence System
          </h1>
          <p className="text-white/90 mt-4 max-w-xl drop-shadow">
            AI-Powered Wildlife Monitoring &amp; Biodiversity Analysis
          </p>
          <div className="flex gap-4 mt-8">
            <Link to="/login" className="px-6 py-2.5 rounded-full bg-wild-500 text-white font-medium hover:bg-wild-400">Login</Link>
            <Link to="/register" className="px-6 py-2.5 rounded-full border border-white/50 text-white font-medium hover:bg-white/10">Register</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-8 py-16 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card">
              <div className="w-10 h-10 rounded-lg bg-wild-100 flex items-center justify-center text-wild-600 mb-3">
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
              <p className="text-sm text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="px-8 py-16 bg-wild-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">About the Project</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              The Wildlife Population Intelligence System leverages artificial intelligence to monitor, analyze, and protect wildlife populations. Our system helps researchers, conservationists, and forest departments make informed decisions for sustainable management.
            </p>
            <Link to="/register" className="inline-block px-6 py-2.5 rounded-full bg-wild-600 text-white font-medium hover:bg-wild-700">Learn More</Link>
          </div>
          <div className="rounded-2xl overflow-hidden h-64 bg-wild-800" />
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="px-8 py-10 bg-wild-950 text-wild-200/70 text-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <span>© 2024 Wildlife Intelligence System. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <Globe size={18} />
          <Mail size={18} />
          <MessageCircle size={18} />
        </div>
      </footer>
    </div>
  );
}