'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StudentLayout from '../../components/layout/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import {
  fetchKnowledgeProfile,
  fetchPrerequisiteGaps,
  startAdaptiveDiagnostic,
  submitAdaptiveDiagnosticAnswer,
  requestSocraticTutor,
  submitTeachBack,
  requestProgressiveHint,
} from '../../services/intelligenceService';
import {
  ShieldCheck,
  Brain,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  BookOpen,
  Compass,
  Cpu,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';

const CONFIDENCE_BADGES = {
  HIGH: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
  MEDIUM: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
  LOW: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30',
};

export default function KnowledgeProfilePage() {
  const { accessToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('SKILLS'); // 'SKILLS', 'DEPENDENCIES', 'DIAGNOSTIC', 'TUTOR'
  const [selectedSkillForGap, setSelectedSkillForGap] = useState('react-hooks');
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [gapLoading, setGapLoading] = useState(false);

  // Diagnostic state
  const [diagnosticSession, setDiagnosticSession] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState(null);

  // AI Tutor 2.0 state
  const [tutorMode, setTutorMode] = useState('SOCRATIC'); // 'SOCRATIC', 'TEACH_BACK', 'HINTS'
  const [tutorInput, setTutorInput] = useState('');
  const [tutorConcept, setTutorConcept] = useState('React useEffect');
  const [tutorResponse, setTutorResponse] = useState(null);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [hintTier, setHintTier] = useState(1);

  const loadProfile = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await fetchKnowledgeProfile(accessToken);
      setProfile(data);
    } catch (err) {
      console.error('Failed to load knowledge profile', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Load dependency gaps
  const handleAnalyzeGaps = async () => {
    if (!accessToken || !selectedSkillForGap) return;
    setGapLoading(true);
    try {
      const data = await fetchPrerequisiteGaps(accessToken, selectedSkillForGap);
      setGapAnalysis(data);
    } catch (err) {
      console.error('Failed to analyze prerequisite gaps', err);
    } finally {
      setGapLoading(false);
    }
  };

  // Start Diagnostic
  const handleStartDiagnostic = async () => {
    if (!accessToken) return;
    setDiagnosticLoading(true);
    setDiagnosticReport(null);
    try {
      const data = await startAdaptiveDiagnostic(accessToken, 'FULLSTACK');
      setDiagnosticSession(data);
      setSelectedAnswer('');
    } catch (err) {
      console.error('Failed to start diagnostic', err);
    } finally {
      setDiagnosticLoading(false);
    }
  };

  // Submit Diagnostic Answer
  const handleSubmitAnswer = async () => {
    if (!accessToken || !diagnosticSession || !selectedAnswer) return;
    setDiagnosticLoading(true);
    try {
      const res = await submitAdaptiveDiagnosticAnswer(accessToken, {
        attemptId: diagnosticSession.attemptId,
        questionId: diagnosticSession.questionId,
        selectedAnswer,
      });

      if (res.status === 'COMPLETED') {
        setDiagnosticSession(null);
        setDiagnosticReport(res.report);
        loadProfile(); // reload knowledge profile with new evidence
      } else {
        setDiagnosticSession(res);
        setSelectedAnswer('');
      }
    } catch (err) {
      console.error('Failed to submit diagnostic answer', err);
    } finally {
      setDiagnosticLoading(false);
    }
  };

  // AI Tutor submit
  const handleTutorSubmit = async () => {
    if (!accessToken || !tutorInput) return;
    setTutorLoading(true);
    setTutorResponse(null);
    try {
      if (tutorMode === 'SOCRATIC') {
        const res = await requestSocraticTutor(accessToken, {
          concept: tutorConcept,
          studentQuestion: tutorInput,
          currentContext: { courseName: 'Modern Web Stack', lessonTitle: 'State & Lifecycle' },
        });
        setTutorResponse(res.guidingQuestions);
      } else if (tutorMode === 'TEACH_BACK') {
        const res = await submitTeachBack(accessToken, {
          concept: tutorConcept,
          studentExplanation: tutorInput,
          targetLevel: 'INTERMEDIATE',
        });
        setTutorResponse(res.feedback);
      } else if (tutorMode === 'HINTS') {
        const res = await requestProgressiveHint(accessToken, {
          problemTitle: tutorConcept,
          problemDescription: 'Implement debounce function with leading & trailing triggers',
          hintTier,
          studentCode: tutorInput,
        });
        setTutorResponse(res.hint);
      }
    } catch (err) {
      console.error('AI Tutor request failed', err);
    } finally {
      setTutorLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              Phase 16 Learning Intelligence Ecosystem
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Evidence-Based Student Knowledge Profile
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Every skill level is backed by concrete evidence: assessments, verified projects, and coding practice.
              No fabricated estimations—clearly separating observed demonstrations, inferred links, and self-reports.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 sm:space-x-4 overflow-x-auto pb-2">
          {[
            { id: 'SKILLS', label: 'Knowledge Profile', icon: ShieldCheck },
            { id: 'DEPENDENCIES', label: 'Skill Dependencies & Gaps', icon: Layers },
            { id: 'DIAGNOSTIC', label: 'Adaptive Diagnostic', icon: Compass },
            { id: 'TUTOR', label: 'AI Tutor 2.0', icon: Brain },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: KNOWLEDGE PROFILE */}
        {activeTab === 'SKILLS' && (
          <div className="space-y-8">
            {/* Metric Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Tracked Skills</span>
                <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">
                  {profile?.summary?.totalSkills || 0}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">High Confidence</span>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {profile?.summary?.highConfidenceSkills || 0}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">Medium Confidence</span>
                <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {profile?.summary?.mediumConfidenceSkills || 0}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-500">Verified Evidence</span>
                <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
                  {profile?.summary?.observedEvidenceCount || 0}
                </p>
              </div>
            </div>

            {/* Skills Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Demonstrated Skill Inventory</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Categorized with confidence rating derived from assessment & project proof
                  </p>
                </div>
                <button
                  onClick={loadProfile}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {loading ? (
                <div className="p-12 text-center text-slate-400">Loading knowledge profile...</div>
              ) : !profile?.skills?.length ? (
                <div className="p-12 text-center space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-slate-600 dark:text-slate-400">No skill evidence recorded yet.</p>
                  <button
                    onClick={() => setActiveTab('DIAGNOSTIC')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl"
                  >
                    Take Adaptive Diagnostic
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {profile.skills.map((s) => (
                    <div key={s.slug} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900 dark:text-white text-base">{s.name}</span>
                          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${CONFIDENCE_BADGES[s.confidence]}`}>
                            {s.confidence} CONFIDENCE
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Level: <span className="font-medium text-slate-700 dark:text-slate-300">{s.level}</span>
                          {s.observedScore > 0 && ` • Demonstrated Score: ${s.observedScore}%`}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{s.evidence?.length || 0} Evidence Items</span>
                        <Link
                          href={`/practice?skill=${s.slug}`}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 rounded-lg font-medium transition"
                        >
                          Practice
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SKILL DEPENDENCIES & PREREQUISITE GAPS */}
        {activeTab === 'DEPENDENCIES' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Prerequisite Dependency Engine</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                When you struggle with an advanced concept (e.g. React Hooks), our dependency graph pinpoints
                the underlying missing foundations (e.g. JavaScript Closures → Variable Scope) rather than making arbitrary guesses.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <input
                  type="text"
                  value={selectedSkillForGap}
                  onChange={(e) => setSelectedSkillForGap(e.target.value)}
                  placeholder="e.g. react-hooks, nextjs, fullstack"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
                <button
                  onClick={handleAnalyzeGaps}
                  disabled={gapLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition"
                >
                  {gapLoading ? 'Analyzing...' : 'Analyze Gaps'}
                </button>
              </div>
            </div>

            {gapAnalysis && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Analysis for: <span className="text-blue-600">{gapAnalysis.targetSkill}</span>
                  </h4>
                  <span className="text-xs px-3 py-1 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {gapAnalysis.totalPrerequisitesAnalyzed} Prerequisites Checked
                  </span>
                </div>

                {gapAnalysis.gapsFoundCount === 0 ? (
                  <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <p className="text-sm text-emerald-800 dark:text-emerald-200">
                      All prerequisite foundations are solid! You have demonstrated strong mastery for prerequisite topics.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                          {gapAnalysis.gapsFoundCount} Prerequisite Gaps Identified
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                          Remediation on the items below is recommended before tackling complex problems in {gapAnalysis.targetSkill}.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {gapAnalysis.identifiedGaps.map((gap) => (
                        <div
                          key={gap.skillSlug}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-800 dark:text-white">{gap.skillName}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 font-semibold">
                              Gap Detected
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{gap.prerequisiteReason}</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{gap.recommendedAction}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ADAPTIVE DIAGNOSTIC */}
        {activeTab === 'DIAGNOSTIC' && (
          <div className="space-y-6">
            {!diagnosticSession && !diagnosticReport && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center max-w-xl mx-auto space-y-6 shadow-sm">
                <Compass className="w-12 h-12 text-blue-600 mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Take the Adaptive Diagnostic</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    A quick 5-question dynamic assessment. Difficulty self-adjusts based on your answers:
                    correct answers unlock higher tiers; struggling routes you to foundation checks.
                  </p>
                </div>
                <button
                  onClick={handleStartDiagnostic}
                  disabled={diagnosticLoading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition"
                >
                  {diagnosticLoading ? 'Starting Session...' : 'Begin Diagnostic'}
                </button>
              </div>
            )}

            {/* In-Progress Session */}
            {diagnosticSession && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto space-y-6 shadow-sm">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                  <span>Question {diagnosticSession.questionIndex} of {diagnosticSession.totalQuestions}</span>
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 font-bold">
                    Tier {diagnosticSession.tier} • {diagnosticSession.skillName}
                  </span>
                </div>

                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  {diagnosticSession.question}
                </h4>

                <div className="space-y-2.5">
                  {diagnosticSession.options.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${
                        selectedAnswer === opt.id
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="diag_opt"
                        value={opt.id}
                        checked={selectedAnswer === opt.id}
                        onChange={(e) => setSelectedAnswer(e.target.value)}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">{opt.text}</span>
                    </label>
                  ))}
                </div>

                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer || diagnosticLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition"
                >
                  {diagnosticLoading ? 'Evaluating...' : 'Submit & Continue'}
                </button>
              </div>
            )}

            {/* Diagnostic Report */}
            {diagnosticReport && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto space-y-6 shadow-sm">
                <div className="text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Diagnostic Completed!</h3>
                  <p className="text-sm text-slate-500">
                    Overall Demonstrated Mastery: <span className="font-bold text-emerald-600">{diagnosticReport.overallMasteryPercentage}%</span>
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Prescribed Curriculum</h4>
                  <div className="space-y-3">
                    {diagnosticReport.recommendedCurriculum?.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-bold text-slate-800 dark:text-white">{item.title}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-600 font-semibold">{item.type}</span>
                        </div>
                        <p className="text-xs text-slate-500">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setDiagnosticReport(null);
                    setActiveTab('SKILLS');
                  }}
                  className="w-full py-3 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-sm rounded-xl transition"
                >
                  View Updated Knowledge Profile
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: AI TUTOR 2.0 */}
        {activeTab === 'TUTOR' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'SOCRATIC', label: 'Socratic Dialogue' },
                  { id: 'TEACH_BACK', label: 'Teach-Back Mode' },
                  { id: 'HINTS', label: 'Progressive Hints' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setTutorMode(mode.id);
                      setTutorResponse(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      tutorMode === mode.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={tutorConcept}
                  onChange={(e) => setTutorConcept(e.target.value)}
                  placeholder="Target Concept (e.g. Closures, Async/Await)"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />

                <textarea
                  rows={4}
                  value={tutorInput}
                  onChange={(e) => setTutorInput(e.target.value)}
                  placeholder={
                    tutorMode === 'SOCRATIC'
                      ? 'Ask your question (the AI will guide you with probing questions rather than giving away code)...'
                      : tutorMode === 'TEACH_BACK'
                      ? 'Explain this concept in your own words. The AI will critique missing points and clarity...'
                      : 'Provide your code snippet or problem attempt for progressive hint assistance...'
                  }
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />

                {tutorMode === 'HINTS' && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium">Hint Tier:</span>
                    {[1, 2, 3, 4].map((tier) => (
                      <button
                        key={tier}
                        onClick={() => setHintTier(tier)}
                        className={`px-3 py-1 rounded text-xs font-bold ${
                          hintTier === tier
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        Tier {tier}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleTutorSubmit}
                  disabled={tutorLoading || !tutorInput}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition"
                >
                  {tutorLoading ? 'Consulting AI...' : 'Submit to AI Tutor 2.0'}
                </button>
              </div>

              {tutorResponse && (
                <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                    <Lightbulb className="w-4 h-4" />
                    AI Mentor Feedback ({tutorMode})
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {tutorResponse}
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
