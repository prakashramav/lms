'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminApi } from '../../services/adminApi';
import {
  Briefcase,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Layers,
  ShieldCheck,
  Search,
  Filter,
  Check,
  X
} from 'lucide-react';

export default function AdminCareerPage() {
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, jobs, reports
  const [analytics, setAnalytics] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, jobsRes, reportsRes] = await Promise.all([
        adminApi.getPlacementAnalytics(),
        adminApi.getAdminJobs({ limit: 20 }),
        adminApi.getJobReports(),
      ]);

      setAnalytics(analyticsRes.data || null);
      setJobs(jobsRes.data || []);
      setReports(reportsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateJobStatus = async (jobId, newStatus) => {
    try {
      await adminApi.updateJobStatus(jobId, newStatus);
      setJobs((prev) =>
        prev.map((j) => (j._id === jobId ? { ...j, status: newStatus } : j))
      );
    } catch (err) {
      alert(err.message || 'Failed to update job status');
    }
  };

  const handleReviewReport = async (reportId, status) => {
    try {
      await adminApi.updateJobReport(reportId, status);
      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? { ...r, status } : r))
      );
    } catch (err) {
      alert(err.message || 'Failed to update report');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Briefcase className="w-3.5 h-3.5" /> Placement &amp; Employer Operations
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Career Intelligence Administration</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Moderate job listings, audit candidate pipelines, review abuse reports, and inspect skill demand trends.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 self-start">
            {[
              { key: 'analytics', label: 'Placement Telemetry' },
              { key: 'jobs', label: `Jobs (${jobs.length})` },
              { key: 'reports', label: `Reports (${reports.length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 1. PLACEMENT TELEMETRY TAB */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 font-medium">Total Openings</span>
                <div className="text-2xl font-bold text-white mt-1">{analytics.totalJobs}</div>
                <span className="text-[11px] text-emerald-400 font-medium">
                  {analytics.publishedJobs} Published
                </span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 font-medium">Partner Companies</span>
                <div className="text-2xl font-bold text-white mt-1">{analytics.totalCompanies}</div>
                <span className="text-[11px] text-slate-500 font-medium">Verified Profiles</span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 font-medium">Applications Filed</span>
                <div className="text-2xl font-bold text-white mt-1">{analytics.totalApplications}</div>
                <span className="text-[11px] text-indigo-400 font-medium">Across All Pipeline Stages</span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 font-medium">Interviews Completed</span>
                <div className="text-2xl font-bold text-white mt-1">{analytics.totalInterviews}</div>
                <span className="text-[11px] text-purple-400 font-medium">Mock &amp; Employer Sessions</span>
              </div>
            </div>

            {/* Pipeline Stage Funnel */}
            {analytics.pipeline && (
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="text-base font-bold text-white">Platform Candidate Pipeline Funnel</h3>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  {[
                    { label: 'Applied', count: analytics.pipeline.APPLIED || 0, color: 'text-blue-400' },
                    { label: 'Screening', count: analytics.pipeline.SCREENING || 0, color: 'text-indigo-400' },
                    { label: 'Interview', count: analytics.pipeline.INTERVIEW || 0, color: 'text-purple-400' },
                    { label: 'Offer', count: analytics.pipeline.OFFER || 0, color: 'text-emerald-400' },
                    { label: 'Rejected', count: analytics.pipeline.REJECTED || 0, color: 'text-rose-400' },
                    { label: 'Withdrawn', count: analytics.pipeline.WITHDRAWN || 0, color: 'text-slate-500' },
                  ].map((stage) => (
                    <div key={stage.label} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                      <div className="text-xs text-slate-400">{stage.label}</div>
                      <div className={`text-xl font-bold ${stage.color} mt-1`}>{stage.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Demanded Skills */}
            {analytics.topSkillsInDemand && analytics.topSkillsInDemand.length > 0 && (
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="text-base font-bold text-white">Top In-Demand Technical Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {analytics.topSkillsInDemand.map((s) => (
                    <div
                      key={s.skill}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs"
                    >
                      <span className="font-semibold text-slate-200">{s.skill}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                        {s.count} jobs
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. JOB MODERATION TAB */}
        {activeTab === 'jobs' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Job Listings Moderation</h3>
              <span className="text-xs text-slate-400">Total {jobs.length} listings</span>
            </div>

            <div className="divide-y divide-slate-800">
              {jobs.map((job) => (
                <div key={job._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{job.title}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          job.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>{job.companyId?.name || 'Company'}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                      <span>•</span>
                      <span>{job.remoteType}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {job.status !== 'PUBLISHED' && (
                      <button
                        onClick={() => handleUpdateJobStatus(job._id, 'PUBLISHED')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        Publish
                      </button>
                    )}
                    {job.status !== 'ARCHIVED' && (
                      <button
                        onClick={() => handleUpdateJobStatus(job._id, 'ARCHIVED')}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                      >
                        Archive
                      </button>
                    )}
                    {job.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleUpdateJobStatus(job._id, 'REJECTED')}
                        className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. ABUSE REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Reported Job Listings</h3>
              <span className="text-xs text-slate-400">Total {reports.length} reports</span>
            </div>

            {reports.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No active abuse or expired reports submitted.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {reports.map((rep) => (
                  <div key={rep._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-rose-400 uppercase">
                          [{rep.reason}]
                        </span>
                        <span className="text-sm font-bold text-white">
                          {rep.jobId?.title || 'Reported Job'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {rep.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 italic">
                        &quot;{rep.description || 'No additional details provided'}&quot;
                      </p>
                      <div className="text-[11px] text-slate-500">
                        Reported by: {rep.reportedBy?.name || rep.reportedBy?.email || 'Student'} on{' '}
                        {new Date(rep.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReviewReport(rep._id, 'ACTION_TAKEN')}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                      >
                        Action Taken
                      </button>
                      <button
                        onClick={() => handleReviewReport(rep._id, 'DISMISSED')}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
