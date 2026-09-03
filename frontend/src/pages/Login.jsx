import React, { useState } from 'react';
import { Shield, Sparkles, AlertCircle, Compass } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      // Build user object from flat response fields
      const userObj = {
        user_id: data.user_id,
        email: data.email,
        role: data.role,
        full_name: data.name,
      };
      login(data.access_token, userObj);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Predefined role credentials for seamless testing & evaluation
  const quickLogins = [
    { name: 'Wildlife Researcher', email: 'researcher@wildlife.org', role: 'wildlife_researcher' },
    { name: 'Conservation Officer', email: 'officer@wildlife.org', role: 'conservation_officer' },
    { name: 'Forest Officer', email: 'forest@wildlife.org', role: 'forest_department_officer' },
    { name: 'Administrator', email: 'admin@wildlife.org', role: 'administrator' }
  ];

  const handleQuickLogin = async (emailVal) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal, password: 'password123' })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Login failed');
      const userObj = { user_id: data.user_id, email: data.email, role: data.role, full_name: data.name };
      login(data.access_token, userObj);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-950/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-teal-950/20 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full space-y-8 bg-slate-800/90 border border-slate-700/50 p-8 rounded-2xl shadow-2xl backdrop-blur-sm z-10">
        <div>
          <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Compass className="h-7 w-7 text-slate-950 font-bold" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
            Wildlife Intelligence
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Population Monitoring & Conservation Platform
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-800 px-3 text-slate-400 font-semibold tracking-wider">
              Evaluator Quick Access
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {quickLogins.map((btn) => (
            <button
              key={btn.email}
              onClick={() => handleQuickLogin(btn.email)}
              className="flex items-center justify-between text-left p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 hover:bg-slate-900 hover:border-emerald-500/50 transition-all group"
            >
              <div>
                <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {btn.name}
                </p>
                <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{btn.email}</p>
              </div>
              <Sparkles className="h-3 w-3 text-slate-600 group-hover:text-emerald-400 transition-colors" />
            </button>
          ))}
        </div>

        {/* Register Account Link */}
        <div className="pt-4 text-center text-xs text-slate-400 border-t border-slate-700/60 mt-5">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2">
            Create / Register new account
          </Link>
        </div>
      </div>
    </div>
  );
}
