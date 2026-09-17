'use client';

import { useState, useEffect, useCallback } from 'react';
import StudentLayout from '../../../components/layout/StudentLayout';
import { useAuth } from '../../../context/AuthContext';
import { fetchLearningSettings, updateLearningSettings } from '../../../services/intelligenceService';
import {
  ShieldCheck,
  Sparkles,
  Bell,
  Sliders,
  Check,
  Brain,
  Lock,
  AlertCircle
} from 'lucide-react';

export default function LearningSettingsPage() {
  const { accessToken } = useAuth();
  const [settings, setSettings] = useState({
    personalizedRecommendations: true,
    aiTutorContext: true,
    learningReminders: 'daily',
    weeklyReview: true,
    adaptivePractice: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);

  const loadSettings = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLearningSettings(accessToken);
      if (data) setSettings((prev) => ({ ...prev, ...data }));
    } catch (err) {
      setError(err.message || 'Failed to load personalization settings.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await updateLearningSettings(accessToken, settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacy & AI Controls</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Learning Personalization
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              You maintain full control over how your learning progress guides recommendations and AI tutor assistance.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition shadow-sm disabled:opacity-50 shrink-0"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Preferences Saved</span>
              </>
            ) : (
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            )}
          </button>
        </div>

        {/* Toggles Container */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 divide-y divide-slate-100 dark:divide-slate-700">
          {/* 1. Recommendations */}
          <div className="pt-0 flex items-start justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>Personalized Recommendations</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                When enabled, the recommendation engine analyzes your completed lessons and weak topics to suggest relevant practice items. If disabled, standard curriculum sequence is served.
              </p>
            </div>

            <button
              onClick={() => handleToggle('personalizedRecommendations')}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                settings.personalizedRecommendations ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
              aria-label="Toggle personalized recommendations"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  settings.personalizedRecommendations ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* 2. AI Tutor Context */}
          <div className="pt-6 flex items-start justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <span>AI Tutor Context Awareness</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                Allows AI Tutor to inspect your current lesson title and recent mistake concepts when you chat. Only minimum necessary metadata is shared; never your entire private database profile.
              </p>
            </div>

            <button
              onClick={() => handleToggle('aiTutorContext')}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                settings.aiTutorContext ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
              aria-label="Toggle AI Tutor context"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  settings.aiTutorContext ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* 3. Adaptive Practice */}
          <div className="pt-6 flex items-start justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>Adaptive Practice Feedback</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                Calibrates spaced revision scheduling intervals based on whether you mark reviews as easy, good, or needing practice.
              </p>
            </div>

            <button
              onClick={() => handleToggle('adaptivePractice')}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                settings.adaptivePractice ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
              aria-label="Toggle adaptive practice"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  settings.adaptivePractice ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* 4. Weekly Review Digest */}
          <div className="pt-6 flex items-start justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" />
                <span>Weekly Learning Synthesis</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                Generate factual summaries of lessons completed, coding challenges solved, and skills practiced over the last 7 days.
              </p>
            </div>

            <button
              onClick={() => handleToggle('weeklyReview')}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                settings.weeklyReview ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
              aria-label="Toggle weekly review"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  settings.weeklyReview ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Security & Privacy Guarantee */}
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start gap-3 text-xs text-slate-500 dark:text-slate-400">
          <Lock className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-slate-900 dark:text-white">Strict Privacy Boundary Guarantee</div>
            <p className="leading-relaxed">
              Your learning activity is strictly isolated. Other students and unauthorized third parties never have access to your personal mistake book or study plans. Instructors receive aggregate, anonymized course health metrics only.
            </p>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
