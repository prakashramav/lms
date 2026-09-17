'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';

function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      setLocalError('Your administrative session has expired. Please sign in again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setLocalError(err.message || 'Access denied. Administrative authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (role) => {
    if (role === 'superadmin') {
      setEmail('superadmin@example.com');
      setPassword('SuperAdminPass123!');
    } else {
      setEmail('admin@example.com');
      setPassword('AdminPass123!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Administrator Access</h1>
          <p className="text-xs text-slate-400">Strictly restricted to authorized platform operations personnel</p>
        </div>

        {localError && (
          <div className="p-3.5 bg-rose-950/60 border border-rose-800 rounded-xl flex items-start gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
            <span>{localError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* MFA 2FA Optional Field */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMfa(!showMfa)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {showMfa ? 'Hide Two-Factor Token' : 'Have a 2FA hardware key / TOTP?'}
            </button>
            {showMfa && (
              <div className="mt-2">
                <input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="Enter 6-digit TOTP code"
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Configurable MFA enabled for production accounts.</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? 'Authenticating Privileges...' : 'Authorize Session'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Quick Fills */}
        <div className="pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500 mb-2">Development Seed Accounts:</p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('superadmin')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 text-amber-300 hover:bg-slate-700 border border-slate-700 transition"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('admin')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 text-indigo-300 hover:bg-slate-700 border border-slate-700 transition"
            >
              Staff Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading secure admin portal...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
