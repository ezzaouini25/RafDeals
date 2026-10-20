'use client';

import { useState, useRef, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, AlertCircle, Ban, UserX, Sparkles } from 'lucide-react';

export default function AdminLoginPage() {
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'invalid' | 'blocked' | 'inactive' | 'other'>('invalid');
  
  const isSubmitting = useRef(false);

  // ✅ Clear session on login page load
  useEffect(() => {
    const clearSession = async () => {
      try {
        await fetch('/api/admin/auth/logout', { method: 'POST' });
      } catch {}
      sessionStorage.removeItem('admin_user');
    };
    clearSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting.current || loading) return;

    setLoading(true);
    setError(null);
    setErrorType('invalid');
    isSubmitting.current = true;

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.status === 'blocked') {
          setErrorType('blocked');
          throw new Error(data.error || 'Your account has been suspended.');
        } else if (data.status === 'inactive') {
          setErrorType('inactive');
          throw new Error(data.error || 'Your account is inactive.');
        } else {
          throw new Error(data.error || 'Login failed');
        }
      }

      sessionStorage.setItem('admin_user', JSON.stringify(data.user));
      window.location.href = '/admin';
      
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
      isSubmitting.current = false;
      setLoading(false);
    }
  };

  const getErrorIcon = () => {
    if (errorType === 'blocked') return <Ban className="w-5 h-5 text-amber-400 shrink-0" />;
    if (errorType === 'inactive') return <UserX className="w-5 h-5 text-amber-400 shrink-0" />;
    return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
  };

  const getErrorStyles = () => {
    if (errorType === 'blocked' || errorType === 'inactive') {
      return 'bg-amber-500/10 border-amber-500/20 text-amber-200';
    }
    return 'bg-rose-500/10 border-rose-500/20 text-rose-200';
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-yellow/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-yellow text-slate-950 font-black text-2xl shadow-xl shadow-yellow/20 mb-3">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">EarnMoney Admin</h1>
          <p className="text-sm font-medium text-slate-400 mt-1">Sign in to manage your website</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 shadow-2xl shadow-black/50">
          {error && (
            <div className={`mb-6 p-4 border ${getErrorStyles()} flex items-start gap-3`}>
              {getErrorIcon()}
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {errorType === 'blocked' && 'Access Denied'}
                  {errorType === 'inactive' && 'Account Inactive'}
                  {errorType === 'invalid' && 'Login Failed'}
                </p>
                <p className="text-xs opacity-80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter username or email"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm font-medium focus:outline-none focus:border-yellow focus:ring-1 focus:ring-yellow transition-all"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm font-medium focus:outline-none focus:border-yellow focus:ring-1 focus:ring-yellow transition-all"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-white transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-yellow text-slate-950 text-sm font-extrabold hover:bg-amber-300 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-yellow/10 disabled:opacity-50 min-h-[48px] relative cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

        </div>

        <p className="text-center text-xs font-medium text-slate-500 mt-6">
          EarnMoney CMS &copy; 2026. Protected by role-based authorization.
        </p>
      </div>
    </div>
  );
}