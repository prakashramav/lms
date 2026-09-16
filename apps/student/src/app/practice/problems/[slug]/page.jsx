'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StudentLayout from '@/components/layout/StudentLayout';
import CodeEditor from '@/components/practice/CodeEditor';
import PreviewFrame from '@/components/practice/PreviewFrame';
import TestPanel from '@/components/practice/TestPanel';
import { useAuth } from '@/context/AuthContext';
import { practiceService } from '@/services/practiceService';
import { aiService } from '@/services/aiService';
import AIHintCard from '@/components/ai/AIHintCard';
import CodeReviewModal from '@/components/ai/CodeReviewModal';
import {
  ChevronLeft,
  CheckCircle2,
  Bookmark,
  Share2,
  Code,
  Layers,
  Eye,
  FileText,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Sparkles,
  Lightbulb,
} from 'lucide-react';

export default function ProblemWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active coding state
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Auth & AI Assistant states
  const { accessToken } = useAuth();
  const [showHintModal, setShowHintModal] = useState(false);
  const [hintTier, setHintTier] = useState(1);
  const [hintText, setHintText] = useState('');
  const [hintLoading, setHintLoading] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const handleFetchHint = async (tier = 1) => {
    if (!problem?._id) return;
    try {
      setHintLoading(true);
      setHintTier(tier);
      setShowHintModal(true);
      const res = await aiService.getHint(accessToken, {
        problemId: problem._id,
        tier,
        currentCode: code,
        language,
      });
      setHintText(res.data?.hint || '');
    } catch {
      setHintText('Failed to load AI hint. Please try again.');
    } finally {
      setHintLoading(false);
    }
  };

  const handleOpenReview = async () => {
    if (!problem?._id) return;
    try {
      setReviewLoading(true);
      setShowReviewModal(true);
      const res = await aiService.reviewCode(accessToken, {
        problemId: problem._id,
        code,
        language,
        executionResult: runResult || submissionResult,
      });
      setReviewText(res.data?.review || '');
    } catch {
      setReviewText('Failed to generate AI code review. Please try again.');
    } finally {
      setReviewLoading(false);
    }
  };

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  // Mobile layout tabs: 'problem' | 'code' | 'preview' | 'tests'
  const [mobileTab, setMobileTab] = useState('problem');
  const [activeRightTab, setActiveRightTab] = useState('editor'); // 'editor' | 'preview'

  const autosaveTimeoutRef = useRef(null);

  useEffect(() => {
    if (!slug) return;

    const loadProblem = async () => {
      setLoading(true);
      try {
        const res = await practiceService.getProblemBySlug(slug);
        const prob = res.data;
        setProblem(prob);
        setIsBookmarked(prob.isBookmarked || false);

        // Initial language selection
        const initialLang = prob.supportedLanguages?.[0] || 'javascript';
        setLanguage(initialLang);

        // Load starter code or restored draft
        if (prob.savedDraft?.code) {
          setCode(prob.savedDraft.code);
          if (prob.savedDraft.language) setLanguage(prob.savedDraft.language);
        } else {
          const starter = prob.starterCode?.[initialLang] || '';
          setCode(starter);
        }

        // Fetch recent submissions for this problem
        practiceService
          .getSubmissions({ problemId: prob._id, limit: 5 })
          .then((subRes) => setSubmissions(subRes.data.submissions || []))
          .catch(() => {});
      } catch (err) {
        setError(err.message || 'Failed to load problem');
      } finally {
        setLoading(false);
      }
    };

    loadProblem();
  }, [slug]);

  // Handle language switch
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    // If draft exists for new lang, or default to starter code
    const starter = problem?.starterCode?.[newLang] || '';
    setCode(starter);
  };

  // Debounced Autosave
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    setSaveStatus('saving');

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(async () => {
      if (!problem?._id) return;
      try {
        await practiceService.saveDraft(problem._id, language, newCode);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 800);
  };

  // Reset code to starter template
  const handleResetCode = () => {
    const starter = problem?.starterCode?.[language] || '';
    setCode(starter);
    if (problem?._id) {
      practiceService.saveDraft(problem._id, language, starter).catch(() => {});
    }
  };

  // Run Code
  const handleRunCode = async () => {
    if (!problem?._id) return;
    setIsRunning(true);
    setRunResult(null);
    setSubmissionResult(null);

    try {
      const res = await practiceService.runCode(problem._id, {
        language,
        code,
        customInput: customInput.trim() ? customInput : undefined,
      });
      setRunResult(res.data);
      if (mobileTab !== 'tests') setMobileTab('tests');
    } catch (err) {
      setRunResult({
        verdict: 'SYSTEM_ERROR',
        passedTests: 0,
        totalTests: problem.testCases?.length || 0,
        errorMessage: err.message || 'Execution failed',
        stderr: err.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Code
  const handleSubmitCode = async () => {
    if (!problem?._id) return;
    setIsSubmitting(true);
    setRunResult(null);
    setSubmissionResult(null);

    try {
      const res = await practiceService.submitCode(problem._id, {
        language,
        code,
      });
      setSubmissionResult(res.data);

      if (res.data.verdict === 'ACCEPTED') {
        setProblem((prev) => ({ ...prev, isSolved: true }));
      }

      // Refresh recent submissions list
      practiceService
        .getSubmissions({ problemId: problem._id, limit: 5 })
        .then((subRes) => setSubmissions(subRes.data.submissions || []))
        .catch(() => {});

      if (mobileTab !== 'tests') setMobileTab('tests');
    } catch (err) {
      setSubmissionResult({
        verdict: 'SYSTEM_ERROR',
        passedTests: 0,
        totalTests: 1,
        errorMessage: err.message || 'Submission failed',
        stderr: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle bookmark
  const handleToggleBookmark = async () => {
    if (!problem?._id) return;
    try {
      const res = await practiceService.toggleBookmark(problem._id);
      setIsBookmarked(res.data.isBookmarked);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <span className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading Coding Workspace...</span>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (error || !problem) {
    return (
      <StudentLayout>
        <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Problem Not Found
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {error || 'The requested coding problem could not be loaded.'}
          </p>
          <Link
            href="/practice"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-500"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Problem Catalog
          </Link>
        </div>
      </StudentLayout>
    );
  }

  const supportsPreview = language === 'html_css' || language === 'react';

  return (
    <StudentLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
        {/* Top Navbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <Link
              href="/practice"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              title="Back to Catalog"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>

            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                {problem.title}
              </h1>
              {problem.isSolved && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  Solved
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleFetchHint(1)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 transition-colors shadow-2xs"
              title="Get Pedagogical Hint"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Get Hint</span>
            </button>

            <button
              type="button"
              onClick={handleOpenReview}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/80 hover:bg-violet-100 transition-colors shadow-2xs"
              title="AI Code Review"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              <span className="hidden sm:inline">Review Code</span>
            </button>

            <Link
              href={`/ai-tutor?problemId=${problem._id}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 hover:bg-blue-100 transition-colors shadow-2xs"
              title="Open AI Tutor with this problem"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Ask AI</span>
            </Link>

            <button
              onClick={handleToggleBookmark}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Problem'}
              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bookmark
                className={`w-4 h-4 ${
                  isBookmarked
                    ? 'fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400'
                    : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile View Tab Switcher */}
        <div className="lg:hidden flex items-center justify-around bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs py-1.5 px-2">
          <button
            onClick={() => setMobileTab('problem')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              mobileTab === 'problem'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Problem
          </button>
          <button
            onClick={() => setMobileTab('code')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              mobileTab === 'code' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Code
          </button>
          {supportsPreview && (
            <button
              onClick={() => setMobileTab('preview')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                mobileTab === 'preview'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Preview
            </button>
          )}
          <button
            onClick={() => setMobileTab('tests')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              mobileTab === 'tests'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Tests
          </button>
        </div>

        {/* Main IDE Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
          {/* LEFT COLUMN: Problem Description */}
          <div
            className={`lg:col-span-5 h-full overflow-y-auto p-5 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 ${
              mobileTab !== 'problem' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="space-y-6 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed">
              {/* Metadata tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {problem.category}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    problem.difficulty === 'EASY'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : problem.difficulty === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                  }`}
                >
                  {problem.difficulty}
                </span>
                {problem.topics?.map((topic, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-500"
                  >
                    {topic}
                  </span>
                ))}
              </div>

              {/* Problem Description Content */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Problem Description
                </h3>
                <div className="prose prose-xs dark:prose-invert max-w-none whitespace-pre-wrap font-sans">
                  {problem.description}
                </div>
              </div>

              {/* Examples */}
              {problem.examples && problem.examples.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Examples
                  </h3>
                  <div className="space-y-3">
                    {problem.examples.map((ex, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2 text-xs"
                      >
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          Example {i + 1}:
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500">Input: </span>
                          <code className="bg-slate-200 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-200 font-mono">
                            {ex.input}
                          </code>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500">Output: </span>
                          <code className="bg-slate-200 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-200 font-mono">
                            {ex.output}
                          </code>
                        </div>
                        {ex.explanation && (
                          <div className="text-slate-500 dark:text-slate-400 text-[11px] italic">
                            Explanation: {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Constraints */}
              {problem.constraints && problem.constraints.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Constraints
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    {problem.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hints */}
              {problem.hints && problem.hints.length > 0 && (
                <details className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-3 text-xs">
                  <summary className="font-semibold text-blue-600 dark:text-blue-400 cursor-pointer select-none">
                    Need a hint?
                  </summary>
                  <ul className="mt-2.5 list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
                    {problem.hints.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Code Editor + Test Panel */}
          <div
            className={`lg:col-span-7 h-full flex flex-col p-3 gap-3 overflow-hidden bg-slate-950 ${
              mobileTab === 'problem' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Split Switcher for HTML/React: Editor vs Preview */}
            {supportsPreview && (
              <div className="flex items-center gap-1 px-1 text-xs">
                <button
                  onClick={() => setActiveRightTab('editor')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activeRightTab === 'editor'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code className="w-3.5 h-3.5 inline mr-1" />
                  Code Editor
                </button>
                <button
                  onClick={() => setActiveRightTab('preview')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activeRightTab === 'preview'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 inline mr-1" />
                  Live Preview
                </button>
              </div>
            )}

            {/* Top Workspace Pane: CodeEditor or PreviewFrame */}
            <div
              className={`flex-1 min-h-[350px] overflow-hidden ${
                mobileTab === 'tests' ? 'hidden lg:block' : 'block'
              }`}
            >
              {supportsPreview && activeRightTab === 'preview' ? (
                <PreviewFrame code={code} language={language} />
              ) : (
                <CodeEditor
                  code={code}
                  onChange={handleCodeChange}
                  language={language}
                  onLanguageChange={handleLanguageChange}
                  supportedLanguages={problem.supportedLanguages}
                  onReset={handleResetCode}
                  saveStatus={saveStatus}
                />
              )}
            </div>

            {/* Bottom Workspace Pane: Test Panel */}
            <div
              className={`h-64 sm:h-72 overflow-hidden ${
                mobileTab === 'code' || mobileTab === 'preview' ? 'hidden lg:block' : 'block'
              }`}
            >
              <TestPanel
                testCases={problem.testCases || []}
                customInput={customInput}
                onCustomInputChange={setCustomInput}
                isRunning={isRunning}
                isSubmitting={isSubmitting}
                onRun={handleRunCode}
                onSubmit={handleSubmitCode}
                runResult={runResult}
                submissionResult={submissionResult}
                submissions={submissions}
                onSelectSubmission={(sub) => {
                  router.push(`/practice/submissions/${sub._id}`);
                }}
              />
            </div>
          </div>
        </div>

        {/* AI Hint Modal */}
        {showHintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="relative w-full max-w-lg">
              <AIHintCard
                problemId={problem._id}
                currentTier={hintTier}
                hintText={hintText}
                loading={hintLoading}
                onFetchHint={handleFetchHint}
              />
              <button
                type="button"
                onClick={() => setShowHintModal(false)}
                className="mt-2 w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-white"
              >
                Close Hint
              </button>
            </div>
          </div>
        )}

        {/* AI Code Review Modal */}
        <CodeReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          reviewText={reviewText}
          problemTitle={problem.title}
          loading={reviewLoading}
        />
      </div>
    </StudentLayout>
  );
}
