import Link from 'next/link';
import { ArrowLeft, Cookie, Shield, Check, Info } from 'lucide-react';

export const metadata = {
  title: 'Cookie Policy | ApexLearn Education Platform',
  description: 'Understand how cookies and local storage are utilized for secure sessions and application state.',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 transition mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Platform
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 shadow-2xl space-y-8">
          <div className="border-b border-slate-800 pb-6">
            <div className="flex items-center space-x-3 mb-3">
              <Cookie className="w-8 h-8 text-indigo-400" />
              <h1 className="text-3xl font-bold tracking-tight text-white">Cookie Policy</h1>
            </div>
            <p className="text-slate-400 text-sm">
              Last reviewed: September 17, 2026 • Platform Version 1.0.0
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" /> 1. Essential Authentication Cookies
            </h2>
            <p className="text-slate-300 leading-relaxed">
              We employ <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded">HttpOnly</code>,{' '}
              <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded">Secure</code>, and{' '}
              <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded">SameSite</code> session cookies
              strictly for authenticating student sessions and rotating refresh tokens. These cookies cannot be
              read by malicious third-party client scripts.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Check className="w-5 h-5 text-indigo-400" /> 2. Preference Storage
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Local browser storage is utilized to save your preferred code editor themes (dark/light), Monaco editor
              font sizes, and draft code progress while practicing problems.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-400" /> 3. Managing Cookies
            </h2>
            <p className="text-slate-300 leading-relaxed">
              You may manage or disable cookies via your browser settings. Note that disabling essential authentication
              cookies will prevent you from logging in and tracking course progress.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
