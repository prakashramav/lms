'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Award, CheckCircle2, AlertCircle, ShieldCheck, Calendar, BookOpen } from 'lucide-react';

export default function CertificateVerificationPage() {
  const params = useParams();
  const certificateId = params?.id;
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!certificateId) return;

    const verify = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        const res = await fetch(`${apiUrl}/certificates/verify/${certificateId}`);
        const data = await res.json();
        if (data.success && data.verified) {
          setCert(data);
        } else {
          setError(data.message || 'Invalid or unverified certificate ID');
        }
      } catch (err) {
        setError('Network error verifying certificate. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [certificateId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Verifying credential against blockchain & platform ledger...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Certificate Unverified</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <p className="text-xs text-slate-500">ID: {certificateId}</p>
          </div>
        ) : cert ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-3 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Officially Verified Credential
            </div>

            <h1 className="text-2xl font-bold text-white mb-1">Certificate of Completion</h1>
            <p className="text-slate-400 text-sm mb-6">Issued by AI Career & Learning Platform</p>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 mb-6 text-left space-y-3">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Recipient</div>
                <div className="text-base font-semibold text-white">{cert.studentName}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Curriculum Completed</div>
                <div className="text-base font-medium text-indigo-400">{cert.courseTitle}</div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {new Date(cert.issueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className="font-mono text-slate-500">{cert.certificateId}</span>
              </div>
            </div>

            {cert.skillsEarned && cert.skillsEarned.length > 0 && (
              <div className="mb-6 text-left">
                <div className="text-xs text-slate-400 font-semibold mb-2">Verified Skills & Competencies:</div>
                <div className="flex flex-wrap gap-1.5">
                  {cert.skillsEarned.map((skill, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 text-xs border border-indigo-500/20">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-slate-500">
              Tamper-evident verification backed by cryptographically hashed completion record.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
