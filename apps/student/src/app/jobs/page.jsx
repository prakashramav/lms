'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StudentLayout from '../../components/layout/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import {
  searchJobs,
  saveJob,
  unsaveJob,
  applyToJob,
  reportJob,
  fetchResumes
} from '../../services/careerService';
import {
  Briefcase,
  Search,
  Bookmark,
  BookmarkCheck,
  MapPin,
  DollarSign,
  Clock,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function JobBoardPage() {
  const { user, accessToken } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [remoteType, setRemoteType] = useState('ALL');
  const [experienceLevel, setExperienceLevel] = useState('ALL');
  const [employmentType, setEmploymentType] = useState('ALL');

  // Application Modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [applicationNotes, setApplicationNotes] = useState('');
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState(null);

  // Report Modal
  const [reportJobId, setReportJobId] = useState(null);
  const [reportReason, setReportReason] = useState('MISLEADING');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  const loadJobs = useCallback(async (pageNumber = 1) => {
    setLoading(true);
    try {
      const res = await searchJobs(accessToken, {
        keyword,
        remoteType: remoteType !== 'ALL' ? remoteType : undefined,
        experienceLevel: experienceLevel !== 'ALL' ? experienceLevel : undefined,
        employmentType: employmentType !== 'ALL' ? employmentType : undefined,
        page: pageNumber,
        limit: 12,
      });

      setJobs(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, keyword, remoteType, experienceLevel, employmentType]);

  useEffect(() => {
    loadJobs(1);
  }, [loadJobs]);

  const handleSaveToggle = async (jobId, currentSaved) => {
    if (!accessToken) return;
    try {
      if (currentSaved) {
        await unsaveJob(accessToken, jobId);
      } else {
        await saveJob(accessToken, jobId);
      }
      setJobs((prev) =>
        prev.map((j) => (j._id === jobId ? { ...j, isSaved: !currentSaved } : j))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenApplyModal = async (job) => {
    setSelectedJob(job);
    setApplyError(null);
    setApplySuccess(false);
    setApplicationNotes('');

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

  const handleSubmitApplication = async () => {
    if (!accessToken || !selectedJob) return;
    setApplying(true);
    setApplyError(null);
    try {
      await applyToJob(accessToken, {
        jobId: selectedJob._id,
        resumeId: selectedResumeId || undefined,
        notes: applicationNotes,
        externalApplication: selectedJob.source === 'EXTERNAL',
      });

      setApplySuccess(true);
      setJobs((prev) =>
        prev.map((j) => (j._id === selectedJob._id ? { ...j, appliedStatus: 'APPLIED' } : j))
      );
    } catch (err) {
      setApplyError(err.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!accessToken || !reportJobId) return;
    try {
      await reportJob(accessToken, reportJobId, reportReason, reportDescription);
      setReportSuccess(true);
      setTimeout(() => {
        setReportJobId(null);
        setReportSuccess(false);
        setReportDescription('');
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Briefcase className="w-3.5 h-3.5" />
              Verified Industry Opportunities
            </div>
            <h1 className="text-3xl font-extrabold text-white">Job Discovery Board</h1>
            <p className="text-sm text-slate-400 mt-1">
              Find software engineering positions calibrated to your verified skills and portfolio.
            </p>
          </div>
          <Link
            href="/applications"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 flex items-center gap-2 self-start"
          >
            Track Active Applications
          </Link>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, technical skill (e.g. React, Node.js), or location..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </div>

            {/* Remote Filter */}
            <select
              value={remoteType}
              onChange={(e) => setRemoteType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Workspaces</option>
              <option value="REMOTE">Remote Only</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">Onsite</option>
            </select>

            {/* Experience Filter */}
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Experience Levels</option>
              <option value="ENTRY">Entry Level</option>
              <option value="MID">Mid Level</option>
              <option value="SENIOR">Senior Level</option>
            </select>

            {/* Employment Type */}
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Employment Types</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="CONTRACT">Contract</option>
            </select>

            <span className="ml-auto text-xs text-slate-500">
              Showing {jobs.length} of {pagination.total} openings
            </span>
          </div>
        </div>

        {/* Job Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading verified openings...</div>
        ) : jobs.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/30 border border-slate-800/80 rounded-2xl">
            <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No matching jobs found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search terms or relaxing workspace filters to discover more roles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => {
              const company = job.companyId || {};
              const isApplied = !!job.appliedStatus;

              return (
                <div
                  key={job._id}
                  className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between transition-all group"
                >
                  <div>
                    {/* Company & Bookmark */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-sm">
                          {company.logo ? (
                            <img src={company.logo} alt={company.name} className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            (company.name || 'C')[0]
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-300">{company.name || 'Verified Tech Partner'}</span>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {job.location} ({job.remoteType})
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSaveToggle(job._id, job.isSaved)}
                        title={job.isSaved ? 'Remove Bookmark' : 'Save Job'}
                        className={`p-2 rounded-lg transition-colors ${
                          job.isSaved
                            ? 'text-indigo-400 bg-indigo-500/10'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {job.isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Job Title */}
                    <Link href={`/jobs/${job._id}`} className="block group-hover:text-indigo-400 transition-colors">
                      <h3 className="text-base font-bold text-white mb-2 leading-snug">{job.title}</h3>
                    </Link>

                    {/* Salary & Experience */}
                    <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-400 mb-4">
                      {job.salaryRange?.min && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          ${(job.salaryRange.min / 1000).toFixed(0)}k - ${(job.salaryRange.max / 1000).toFixed(0)}k
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{job.experienceLevel}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{job.employmentType}</span>
                    </div>

                    {/* Skills pills */}
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {job.skills.slice(0, 4).map((s) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Matching signals */}
                    {job.matchingSignals && job.matchingSignals.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 mb-4">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 mb-1">
                          <Sparkles className="w-3.5 h-3.5" /> Transparent Match Breakdown
                        </div>
                        <ul className="text-[11px] text-slate-400 space-y-0.5">
                          {job.matchingSignals.map((sig, i) => (
                            <li key={i} className="flex items-center gap-1 text-slate-300">
                              <span className="text-indigo-400">•</span> {sig}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setReportJobId(job._id)}
                      className="text-[11px] text-slate-500 hover:text-slate-400"
                    >
                      Report
                    </button>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/jobs/${job._id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        Details
                      </Link>

                      {isApplied ? (
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                          Applied ({job.appliedStatus})
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenApplyModal(job)}
                          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                        >
                          Apply Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-6">
            <button
              onClick={() => loadJobs(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => loadJobs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* APPLY MODAL */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 relative">
              <button
                onClick={() => setSelectedJob(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Application Submission</span>
                <h3 className="text-lg font-bold text-white mt-1">{selectedJob.title}</h3>
                <p className="text-xs text-slate-400">{selectedJob.companyId?.name || 'Partner Company'}</p>
              </div>

              {applySuccess ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Application Recorded!</div>
                    <div className="text-xs text-emerald-400/80 mt-0.5">
                      You can monitor its status and interview steps on your Application Tracker.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {applyError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      {applyError}
                    </div>
                  )}

                  {/* Resume Picker */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Select Resume:
                    </label>
                    {resumes.length === 0 ? (
                      <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-400">
                        No resumes created yet. You can still apply, but creating a resume at{' '}
                        <Link href="/resume" className="text-indigo-400 underline">
                          /resume
                        </Link>{' '}
                        is highly recommended.
                      </div>
                    ) : (
                      <select
                        value={selectedResumeId}
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        {resumes.map((r) => (
                          <option key={r._id} value={r._id}>
                            {r.title} (v{r.version || 1})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Candidate Notes */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Personal Application Notes / Follow-up Strategy (Private to you):
                    </label>
                    <textarea
                      rows={3}
                      value={applicationNotes}
                      onChange={(e) => setApplicationNotes(e.target.value)}
                      placeholder="e.g. Highlighted my real-time websocket project in cover letter. Follow-up planned next Monday."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {selectedJob.source === 'EXTERNAL' && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                      Note: This is an external listing. Clicking apply will log the entry to your platform tracker and open the external application portal.
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedJob(null)}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitApplication}
                      disabled={applying}
                      className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {applying ? 'Recording...' : 'Submit Application'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REPORT MODAL */}
        {reportJobId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 relative">
              <button
                onClick={() => setReportJobId(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-bold text-white">Report Job Listing</h3>

              {reportSuccess ? (
                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs">
                  Report submitted for administrator audit. Thank you!
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Reason for report:</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    >
                      <option value="MISLEADING">Misleading Information</option>
                      <option value="EXPIRED">Role Expired / Closed</option>
                      <option value="INCORRECT_INFO">Incorrect Requirements</option>
                      <option value="SPAM">Spam</option>
                      <option value="FRAUD">Suspected Fraudulent Listing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Optional details:</label>
                    <textarea
                      rows={3}
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Explain what is incorrect about this posting..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setReportJobId(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitReport}
                      className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white"
                    >
                      Submit Report
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
