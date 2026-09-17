import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Eye, Database, FileText } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | ApexLearn Education Platform',
  description: 'Learn how ApexLearn protects, handles, and processes your personal data, learning progress, and platform interactions.',
};

export default function PrivacyPolicyPage() {
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
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
              <h1 className="text-3xl font-bold tracking-tight text-white">Privacy Policy</h1>
            </div>
            <p className="text-slate-400 text-sm">
              Last updated: September 17, 2026 • Platform Version 1.0.0
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-400" /> 1. Information We Collect
            </h2>
            <p className="text-slate-300 leading-relaxed">
              ApexLearn collects information to facilitate career-oriented education, track learning progress,
              and execute code in sandbox environments. This includes account credentials (name, email), enrollment
              records, coding practice submissions, assessment responses, and AI Tutor conversation history.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" /> 2. Data Usage & Storage
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Your data is stored in secured, isolated database environments with industry-standard encryption
              at rest and in transit (TLS 1.3). Passwords are never stored in plaintext and are salted using
              cryptographic hashing algorithms. We do not sell your personal information or telemetry data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" /> 3. Code Execution & Sandboxing
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Code submitted in the practice IDE is executed in ephemeral, isolated sandboxes with strict CPU,
              memory, and timeout limits. Student code submissions are preserved solely for evaluation, progress tracking,
              and personal portfolio review.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" /> 4. Your Rights & Data Retention
            </h2>
            <p className="text-slate-300 leading-relaxed">
              You retain the right to request export or erasure of your student account data at any time.
              Contact our compliance officers via <Link href="/contact" className="text-indigo-400 hover:underline">Support & Contact</Link> for data requests.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
