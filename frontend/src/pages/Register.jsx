import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PawPrint, User, Mail, Lock, Eye, EyeOff, Phone, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import registerImage from "../assets/register-forest.png";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("");
  const [role, setRole] = useState("Wildlife Researcher");
  const [agreed, setAgreed] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: fullName,
        username,
        email,
        password,
        phone_number: phoneNumber || null,
        country: country || null,
        role: role,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel */}
      <div className="relative lg:w-1/2 min-h-[320px] lg:min-h-screen overflow-hidden">
        <img
          src={registerImage}
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
            Join Us in Protecting{" "}
            <span className="text-wild-400">Wildlife &amp; Nature</span> for a
            Better Tomorrow
          </h1>
          <p className="text-white/80 mt-4 max-w-sm">
            Create your account and be a part of AI-powered wildlife
            monitoring and biodiversity conservation.
          </p>
        </div>
      </div>

      {/* Right panel — register form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-slate-800">Create Your Account</h2>
          <p className="text-slate-500 text-sm mt-1 mb-6">Register to get started</p>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              Account created successfully! Redirecting to login...
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <div className="mt-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:border-wild-500">
                  <User size={16} className="text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full outline-none text-sm placeholder:text-slate-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <div className="mt-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:border-wild-500">
                  <Mail size={16} className="text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full outline-none text-sm placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Username</label>
              <div className="mt-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:border-wild-500">
                <User size={16} className="text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full outline-none text-sm placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="mt-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:border-wild-500">
                  <Lock size={16} className="text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full outline-none text-sm placeholder:text-slate-400"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-slate-400">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Confirm Password</label>
                <div className="mt-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:border-wild-500">
                  <Lock size={16} className="text-slate-400" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full outline-none text-sm placeholder:text-slate-400"
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)} className="text-slate-400">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Phone Number</label>
                <div className="mt-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:border-wild-500">
                  <Phone size={16} className="text-slate-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full outline-none text-sm placeholder:text-slate-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Country</label>
                <div className="mt-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:border-wild-500">
                  <Globe size={16} className="text-slate-400" />
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full outline-none text-sm text-slate-600 bg-transparent"
                  >
                    <option value="">Select your country</option>
                    <option value="IN">India</option>
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Account Role</label>
              <div className="mt-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 focus-within:border-wild-500">
                <User size={16} className="text-slate-400" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full outline-none text-sm text-slate-700 bg-transparent"
                >
                  <option value="Wildlife Researcher">Wildlife Researcher</option>
                  <option value="Conservation Officer">Conservation Officer</option>
                  <option value="Forest Department Officer">Forest Department Officer</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <span>
                I agree to the{" "}
                <a href="#" className="text-wild-700 font-medium hover:underline">Terms of Service</a>{" "}
                and{" "}
                <a href="#" className="text-wild-700 font-medium hover:underline">Privacy Policy</a>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-wild-900 text-white font-medium hover:bg-wild-800 transition-colors disabled:opacity-60 shadow-sm"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-wild-700 font-medium hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}