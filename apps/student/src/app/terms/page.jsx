import Link from 'next/link';
import { ArrowLeft, BookOpen, AlertCircle, CheckCircle, Scale } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | ApexLearn Education Platform',
  description: 'Terms of Service, acceptable use policy, academic integrity, and coding sandbox guidelines for ApexLearn.',
};

export default function TermsPage() {
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
              <Scale className="w-8 h-8 text-indigo-400" />
              <h1 className="text-3xl font-bold tracking-tight text-white">Terms of Service</h1>
            </div>
            <p className="text-slate-400 text-sm">
              Effective Date: September 17, 2026 • Platform Version 1.0.0
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" /> 1. Platform Use & Eligibility
            </h2>
            <p className="text-slate-300 leading-relaxed">
              By registering or accessing ApexLearn, you agree to comply with these terms, our Community Guidelines,
              and all applicable local and international laws. Accounts may not be shared across individuals.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-indigo-400" /> 2. Academic Integrity & Sandbox Rules
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Students must maintain strict academic integrity during assessments and coding practice challenges.
              The automated coding sandbox must not be used to launch denial-of-service attacks, port scan internal networks,
              mine cryptocurrency, or attempt system break-outs. Any detected abuse will result in immediate account suspension.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-indigo-400" /> 3. Intellectual Property
            </h2>
            <p className="text-slate-300 leading-relaxed">
              All curriculum videos, lesson documents, and assessment question banks remain the exclusive intellectual
              property of ApexLearn and respective accredited instructors. Code written by students remains their own work.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
