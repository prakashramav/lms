'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StudentLayout from '../../components/layout/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import {
  fetchApplications,
  updateApplicationStatus,
  updateApplicationNotes
} from '../../services/careerService';
import {
  TrendingUp,
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
  Calendar,
  Building2,
  Edit3,
  ChevronRight,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

const STATUS_BADGES = {
  SAVED: { bg: 'bg-slate-800 text-slate-300 border-slate-700', label: 'Saved' },
  APPLIED: { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30', label: 'Applied' },
  SCREENING: { bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', label: 'Screening' },
  INTERVIEW: { bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30', label: 'Interviewing' },
  OFFER: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: 'Offer Received' },
  REJECTED: { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30', label: 'Not Selected' },
  WITHDRAWN: { bg: 'bg-slate-800 text-slate-500 border-slate-700', label: 'Withdrawn' },
};

export default function ApplicationsTrackerPage() {
  const { accessToken } = useAuth();
  const [applications, setApplications] = useState([]);
  const [pipelineCounts, setPipelineCounts] = useState({});
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Notes editing state
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [notesContent, setNotesContent] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Timeline dialog state
  const [activeTimelineApp, setActiveTimelineApp] = useState(null);

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetchApplications(accessToken, selectedStatus);
      setApplications(res.applications || res.data || []);
      setPipelineCounts(res.pipelineCounts || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleWithdraw = async (appId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
    try {
      await updateApplicationStatus(accessToken, appId, 'WITHDRAWN', 'Withdrawn by candidate');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to withdraw');
    }
  };

  const handleSaveNotes = async (appId) => {
    setSavingNotes(true);
    try {
      await updateApplicationNotes(accessToken, appId, notesContent);
      setEditingNotesId(null);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <TrendingUp className="w-3.5 h-3.5" /> Candidate Pipeline
            </div>
            <h1 className="text-3xl font-extrabold text-white">Application Tracker</h1>
            <p className="text-sm text-slate-400 mt-1">
              Organize and track your submissions from initial review to interviews and offers.
            </p>
          </div>
          <Link
            href="/jobs"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold self-start"
          >
            Discover More Jobs
          </Link>
        </div>

        {/* Status Pipeline Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
          {[
            { key: 'ALL', label: 'All Applications', count: applications.length },
            { key: 'APPLIED', label: 'Applied', count: pipelineCounts.APPLIED || 0 },
            { key: 'SCREENING', label: 'Screening', count: pipelineCounts.SCREENING || 0 },
            { key: 'INTERVIEW', label: 'Interview', count: pipelineCounts.INTERVIEW || 0 },
            { key: 'OFFER', label: 'Offer', count: pipelineCounts.OFFER || 0 },
            { key: 'REJECTED', label: 'Not Selected', count: pipelineCounts.REJECTED || 0 },
            { key: 'WITHDRAWN', label: 'Withdrawn', count: pipelineCounts.WITHDRAWN || 0 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                selectedStatus === tab.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedStatus === tab.key ? 'bg-indigo-800' : 'bg-slate-800 text-slate-400'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading application pipeline...</div>
        ) : applications.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/30 border border-slate-800 rounded-2xl">
            <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No applications in this stage</h3>
            <p className="text-xs text-slate-500 mt-1">Applications you submit will appear here in chronological order.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const job = app.jobId || {};
              const company = job.companyId || {};
              const statusBadge = STATUS_BADGES[app.status] || STATUS_BADGES.APPLIED;

              return (
                <div
                  key={app._id}
                  className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 sm:p-6 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-base shrink-0 overflow-hidden">
                        {company.logo ? (
                          <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                        ) : (
                          (company.name || 'C')[0]
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/jobs/${job._id}`} className="text-base font-bold text-white hover:text-indigo-400 transition-colors">
                            {job.title || 'Role'}
                          </Link>
                          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}>
                            {statusBadge.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="font-medium text-slate-300">{company.name || 'Company'}</span>
                          <span>•</span>
                          <span>Applied on {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}</span>
                          {app.resumeId && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-400 flex items-center gap-1">
                                <FileText className="w-3 h-3" /> {app.resumeId.title || 'Attached Resume'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <button
                        onClick={() => setActiveTimelineApp(app)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5"
                      >
                        Timeline ({app.timeline?.length || 1})
                      </button>

                      {app.status !== 'WITHDRAWN' && app.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleWithdraw(app._id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notes snippet or editor */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    {editingNotesId === app._id ? (
                      <div className="w-full flex items-center gap-2">
                        <input
                          type="text"
                          value={notesContent}
                          onChange={(e) => setNotesContent(e.target.value)}
                          placeholder="Update candidate notes..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-white"
                        />
                        <button
                          onClick={() => handleSaveNotes(app._id)}
                          disabled={savingNotes}
                          className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingNotesId(null)}
                          className="px-2 py-1 text-slate-400 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-slate-400 italic">
                          {app.notes ? `Note: ${app.notes}` : 'No notes added yet.'}
                        </span>
                        <button
                          onClick={() => {
                            setEditingNotesId(app._id);
                            setNotesContent(app.notes || '');
                          }}
                          className="text-slate-400 hover:text-indigo-400 flex items-center gap-1 ml-4"
                        >
                          <Edit3 className="w-3 h-3" /> Edit Note
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TIMELINE DRAWER / MODAL */}
        {activeTimelineApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 relative">
              <button
                onClick={() => setActiveTimelineApp(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-white"
              >
                ✕
              </button>

              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Application History</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{activeTimelineApp.jobId?.title}</h3>
                <p className="text-xs text-slate-400">{activeTimelineApp.jobId?.companyId?.name}</p>
              </div>

              <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6 py-2">
                {activeTimelineApp.timeline?.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-2 border-slate-900" />
                    <div className="text-xs font-bold text-white">{step.status}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{step.note}</div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {new Date(step.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveTimelineApp(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
