'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StudentLayout from '../../../components/layout/StudentLayout';
import { useAuth } from '../../../context/AuthContext';
import {
  fetchJobDetails,
  saveJob,
  unsaveJob,
  applyToJob,
  fetchResumes,
  reportJob
} from '../../../services/careerService';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Building2,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Globe,
  ExternalLink,
  ShieldCheck,
  X
} from 'lucide-react';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const jobId = params.jobId;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Apply State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [notes, setNotes] = useState('');
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  const loadJob = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobDetails(jobId, accessToken);
      setJob(data);
    } catch (err) {
      setError(err.message || 'Job not found');
    } finally {
      setLoading(false);
    }
  }, [jobId, accessToken]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const handleSaveToggle = async () => {
    if (!accessToken || !job) return;
    try {
      if (job.isSaved) {
        await unsaveJob(accessToken, job._id);
        setJob({ ...job, isSaved: false });
      } else {
        await saveJob(accessToken, job._id);
        setJob({ ...job, isSaved: true });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenApply = async () => {
    setShowApplyModal(true);
    if (accessToken) {
      try {
        const studentResumes = await fetchResumes(accessToken);
        setResumes(studentResumes || []);
        if (studentResumes && studentResumes.length > 0) {
          setSelectedResumeId(studentResumes[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleApplySubmit = async () => {
    if (!accessToken || !job) return;
    setApplying(true);
    try {
      await applyToJob(accessToken, {
        jobId: job._id,
        resumeId: selectedResumeId || undefined,
        notes,
        externalApplication: job.source === 'EXTERNAL',
      });
      setApplySuccess(true);
      setJob({ ...job, appliedStatus: 'APPLIED' });
    } catch (err) {
      alert(err.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-400 text-sm">
          Loading job details...
        </div>
      </StudentLayout>
    );
  }

  if (error || !job) {
    return (
      <StudentLayout>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-1">Listing Unavailable</h2>
          <p className="text-xs text-slate-400 mb-6">{error || 'This job listing may have been closed or removed.'}</p>
          <Link
            href="/jobs"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            Back to Job Board
          </Link>
        </div>
      </StudentLayout>
    );
  }

  const company = job.companyId || {};

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Job Discovery
        </Link>

        {/* Job Header Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-xl overflow-hidden shrink-0">
                {company.logo ? (
                  <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                ) : (
                  (company.name || 'C')[0]
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                  <span className="font-semibold text-indigo-400">{company.name || 'Verified Company'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" /> {job.location} ({job.remoteType})
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> Posted {new Date(job.postedAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start">
              <button
                onClick={handleSaveToggle}
                className={`p-2.5 rounded-xl border transition-colors ${
                  job.isSaved
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {job.isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
              </button>

              {job.appliedStatus ? (
                <div className="px-5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  Applied: {job.appliedStatus}
                </div>
              ) : (
                <button
                  onClick={handleOpenApply}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  Apply for Role
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Employment Type</div>
              <div className="text-sm font-semibold text-white mt-0.5">{job.employmentType}</div>
            </div>
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Experience Level</div>
              <div className="text-sm font-semibold text-white mt-0.5">{job.experienceLevel}</div>
            </div>
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Workspace Setting</div>
              <div className="text-sm font-semibold text-white mt-0.5">{job.remoteType}</div>
            </div>
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Salary Range</div>
              <div className="text-sm font-semibold text-emerald-400 mt-0.5">
                {job.salaryRange?.min
                  ? `$${(job.salaryRange.min / 1000).toFixed(0)}k - $${(job.salaryRange.max / 1000).toFixed(0)}k /yr`
                  : 'Competitive'}
              </div>
            </div>
          </div>
        </div>

        {/* Skill Alignment Box */}
        {job.matchingSignals && job.matchingSignals.length > 0 && (
          <div className="bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 text-sm font-bold text-indigo-300 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Skill &amp; Preference Alignment Breakdown
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {job.matchingSignals.map((sig, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-200 bg-slate-800/60 p-2.5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  {sig}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description & Requirements */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-3">Role Overview</h2>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {job.description}
            </div>
          </div>

          {job.skills && job.skills.length > 0 && (
            <div className="pt-6 border-t border-slate-800">
              <h3 className="text-base font-bold text-white mb-3">Target Technical Stack</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Company Overview */}
        {company.name && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-white mb-3">About {company.name}</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">{company.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span>Industry: {company.industry}</span>
              <span>•</span>
              <span>Company Size: {company.size}</span>
              {company.website && (
                <>
                  <span>•</span>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Globe className="w-3.5 h-3.5" /> Website
                  </a>
                </>
              )}
            </div>
          </div>
        )}

        {/* APPLY MODAL */}
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 relative">
              <button
                onClick={() => setShowApplyModal(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-white">Apply for {job.title}</h3>

              {applySuccess ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold">Application Submitted!</div>
                    <div className="text-xs text-emerald-400/80 mt-0.5">
                      Your application has been logged to your Application Tracker.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Choose Resume to Attach:
                    </label>
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    >
                      {resumes.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.title} (v{r.version || 1})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Candidate Notes (private):
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add personal notes or interview preparation plan..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setShowApplyModal(false)}
                      className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApplySubmit}
                      disabled={applying}
                      className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {applying ? 'Submitting...' : 'Confirm Application'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
