'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminApi } from '../../services/adminApi';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  Flag,
  Shield,
  Sparkles,
  BookOpen,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function PlatformSettingsPage() {
  const { hasPermission } = useAuth();
  const [settings, setSettings] = useState(null);
  const [flags, setFlags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSettingsAndFlags = async () => {
    setIsLoading(true);
    try {
      const [sRes, fRes] = await Promise.all([
        adminApi.getSettings(),
        adminApi.getFeatureFlags(),
      ]);
      setSettings(sRes.data || {});
      setFlags(fRes.data || []);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndFlags();
  }, []);

  const handleToggleFlag = async (key, currentEnabled) => {
    try {
      await adminApi.updateFeatureFlag(key, { enabled: !currentEnabled });
      setFlags((prev) =>
        prev.map((f) => (f.key === key ? { ...f, enabled: !currentEnabled } : f))
      );
    } catch (err) {
      alert(err.message || 'Failed to toggle flag');
    }
  };

  const handleSaveSettings = async (group, values) => {
    try {
      await adminApi.updateSettings({ group, settings: values });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to update settings');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Settings & Feature Flags</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure global governance policies, AI quotas, and dynamic feature toggles
          </p>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Settings saved and applied successfully across all cluster nodes.</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading configurations...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Feature Flags Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Flag className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white">Dynamic Feature Flags</h2>
              </div>

              <div className="space-y-3">
                {flags.map((flag) => (
                  <div
                    key={flag.key}
                    className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-white">{flag.key}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {flag.environment}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{flag.description}</p>
                    </div>

                    <button
                      disabled={!hasPermission('settings.manage')}
                      onClick={() => handleToggleFlag(flag.key, flag.enabled)}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                        flag.enabled ? 'bg-indigo-600' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                          flag.enabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      ></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Policies Configuration */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">Curriculum & Publishing Policies</h2>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-200">Mandatory Course Review Workflow</p>
                    <p className="text-slate-400 mt-0.5">Require administrator approval before faculty can publish to catalog</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-bold rounded-lg border border-emerald-500/20 text-[10px]">
                    ENFORCED
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-200">Instructor Course Deletion Policy</p>
                    <p className="text-slate-400 mt-0.5">Instructors cannot permanently delete published courses with active enrollments</p>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 font-bold rounded-lg border border-indigo-500/20 text-[10px]">
                    LOCKED
                  </span>
                </div>
              </div>
            </div>

            {/* AI Policy & Safeguards */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <h2 className="text-sm font-semibold text-white">AI Tutor & Rate Limiting Thresholds</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-slate-400">Context Window Quota</span>
                  <p className="text-base font-bold text-white font-mono">2,048 Tokens / Prompt</p>
                  <p className="text-[11px] text-slate-500">Limits token exhaustion</p>
                </div>
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-slate-400">Rate Limit Ceiling</span>
                  <p className="text-base font-bold text-white font-mono">20 Queries / Min</p>
                  <p className="text-[11px] text-slate-500">DDoS and abuse mitigation</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
