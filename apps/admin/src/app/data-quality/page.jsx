'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Wrench,
  Database,
  ArrowRight,
  FileText,
  Lock,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function DataQualityPage() {
  const { accessToken } = useAuth();
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmToken, setConfirmToken] = useState('');
  const [repairLoading, setRepairLoading] = useState(false);
  const [repairSuccessMessage, setRepairSuccessMessage] = useState(null);

  const runScan = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setRepairSuccessMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/data-quality/scan`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setScanResult(data.data);
      }
    } catch (err) {
      console.error('Failed to scan data quality', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    runScan();
  }, [runScan]);

  const handlePreview = async (issue) => {
    setSelectedIssue(issue);
    setPreviewLoading(true);
    setConfirmToken('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/data-quality/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ category: issue.category }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewData(data.data);
      }
    } catch (err) {
      console.error('Failed to preview repair', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExecuteRepair = async () => {
    if (!selectedIssue || confirmToken !== 'CONFIRM_REPAIR') return;
    setRepairLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/data-quality/repair`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          category: selectedIssue.category,
          confirmationToken: confirmToken,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRepairSuccessMessage(data.message || 'Repair executed successfully');
        setSelectedIssue(null);
        setPreviewData(null);
        runScan();
      }
    } catch (err) {
      console.error('Failed to execute repair', err);
    } finally {
      setRepairLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Platform Data Quality & Integrity
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Phase 16 Automated Consistency Scanner: detects orphan records, broken course links, and missing skills.
            </p>
          </div>
          <button
            onClick={runScan}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Run Integrity Scan
          </button>
        </div>

        {/* Success Alert */}
        {repairSuccessMessage && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">{repairSuccessMessage}</p>
          </div>
        )}

        {/* Status Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Database Status</span>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  scanResult?.healthStatus === 'HEALTHY'
                    ? 'bg-emerald-500'
                    : scanResult?.healthStatus === 'WARNING'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {scanResult?.healthStatus || 'UNKNOWN'}
              </span>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Identified Discrepancies</span>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {scanResult?.totalIssuesCount || 0}
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Last Scanned</span>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-2">
              {scanResult?.scannedAt ? new Date(scanResult.scannedAt).toLocaleTimeString() : 'Not scanned'}
            </p>
          </div>
        </div>

        {/* Issue List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Consistency Audit Report</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Discrepancies require explicit confirmation before audited repair execution
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-400">Scanning collections...</div>
          ) : !scanResult?.issues?.length ? (
            <div className="p-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="font-bold text-slate-800 dark:text-white">All collections are consistent!</p>
              <p className="text-xs text-slate-400">No orphaned records or missing skills detected.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {scanResult.issues.map((issue) => (
                <div key={issue.category} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{issue.category}</span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          issue.severity === 'HIGH'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                            : issue.severity === 'MEDIUM'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        {issue.severity} SEVERITY
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{issue.description}</p>
                    <p className="text-xs text-slate-400">
                      Affected Count: <span className="font-semibold text-slate-700 dark:text-slate-300">{issue.affectedCount}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handlePreview(issue)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 text-xs font-semibold rounded-xl transition"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Preview Repair
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Repair Confirmation */}
        {selectedIssue && previewData && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Audited Data Repair Preview</h3>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                <p><strong>Category:</strong> {previewData.category}</p>
                <p><strong>Affected Records:</strong> {previewData.affectedCount}</p>
                <p><strong>Proposed Action:</strong> {previewData.proposedAction}</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Type <span className="text-rose-600 font-mono">CONFIRM_REPAIR</span> to authorize execution:
                </label>
                <input
                  type="text"
                  value={confirmToken}
                  onChange={(e) => setConfirmToken(e.target.value)}
                  placeholder="CONFIRM_REPAIR"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-sm font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIssue(null);
                    setPreviewData(null);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteRepair}
                  disabled={confirmToken !== 'CONFIRM_REPAIR' || repairLoading}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white shadow"
                >
                  {repairLoading ? 'Executing Repair...' : 'Execute Repair'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
