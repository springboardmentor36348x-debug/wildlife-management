import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PawPrint, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import heroImage from "../assets/hero-forest.png";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel */}
      <div className="relative lg:w-1/2 min-h-[320px] lg:min-h-screen overflow-hidden">
        <img
          src={heroImage}
          alt="Wildlife forest"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />

        <div className="relative z-10 h-full flex flex-col justify-center px-10 py-12 lg:px-16">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
              <PawPrint className="text-white" size={20} />
            </div>
            <span className="text-white font-semibold text-lg leading-tight">
              Wildlife
              <br />
              Intelligence
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white leading-snug max-w-md">
            AI-Powered Wildlife{" "}
            <span className="text-wild-400">Monitoring &amp; Biodiversity</span>{" "}
            Analysis
          </h1>
          <p className="text-white/80 mt-4 max-w-sm">
            Protect wildlife. Preserve nature. For a sustainable future.
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-800">Welcome Back!</h2>
          <p className="text-slate-500 text-sm mt-1 mb-6">Login to your account</p>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <div className="mt-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:border-wild-500">
                <Mail size={16} className="text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="w-full outline-none text-sm placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:border-wild-500">
                <Lock size={16} className="text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full outline-none text-sm placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-slate-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" className="rounded border-slate-300" />
                Remember Me
              </label>
              <a href="#" className="text-wild-700 font-medium hover:underline">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-wild-900 text-white font-medium hover:bg-wild-800 transition-colors disabled:opacity-60 shadow-sm"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-wild-700 font-medium hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}