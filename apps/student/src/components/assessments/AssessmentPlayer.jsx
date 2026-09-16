'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Timer from './Timer';
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Flag,
  RotateCcw,
  Check,
  Send,
  HelpCircle,
  Menu,
  X,
  RefreshCw,
} from 'lucide-react';

export default function AssessmentPlayer({
  assessment,
  attempt,
  questions = [],
  expiresAt,
  onSaveAnswer,
  onSubmitAttempt,
}) {
  const router = useRouter();

  // Current active question index (0-indexed)
  const [currentIndex, setCurrentIndex] = useState(0);

  // Map of questionId -> selectedAnswers array
  const [answers, setAnswers] = useState(() => {
    const map = {};
    (attempt?.answers || []).forEach((a) => {
      map[a.questionId] = a.selectedAnswers || [];
    });
    return map;
  });

  // Flagged for review question IDs
  const [flaggedIds, setFlaggedIds] = useState(new Set());

  // Auto-save sync status: 'idle' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState('saved');

  // Submit modal visibility
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Mobile question drawer
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Current active question
  const currentQuestion = questions[currentIndex] || null;
  const currentSelectedAnswers = currentQuestion
    ? answers[currentQuestion._id] || []
    : [];

  // Toggle single choice option
  const handleSelectSingleChoice = (optionId) => {
    if (!currentQuestion) return;
    const newAnswers = [optionId];
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion._id]: newAnswers,
    }));
    triggerAutoSave(currentQuestion._id, newAnswers);
  };

  // Toggle multiple choice option
  const handleToggleMultipleChoice = (optionId) => {
    if (!currentQuestion) return;
    const prevSelected = answers[currentQuestion._id] || [];
    let newAnswers;
    if (prevSelected.includes(optionId)) {
      newAnswers = prevSelected.filter((id) => id !== optionId);
    } else {
      newAnswers = [...prevSelected, optionId];
    }

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion._id]: newAnswers,
    }));
    triggerAutoSave(currentQuestion._id, newAnswers);
  };

  // Debounced auto-save
  const saveTimeoutRef = useRef(null);
  const triggerAutoSave = useCallback(
    (questionId, selectedAnswers) => {
      setSaveStatus('saving');
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await onSaveAnswer(questionId, selectedAnswers);
          setSaveStatus('saved');
        } catch {
          setSaveStatus('error');
        }
      }, 500);
    },
    [onSaveAnswer]
  );

  // Toggle flagged status
  const toggleFlagCurrent = () => {
    if (!currentQuestion) return;
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion._id)) {
        next.delete(currentQuestion._id);
      } else {
        next.add(currentQuestion._id);
      }
      return next;
    });
  };

  // Submit attempt
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await onSubmitAttempt();
      // Redirect to results page
      router.push(`/assessments/${assessment._id}/results/${attempt._id}`);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit assessment. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Timer expiration auto-submit
  const handleTimerExpire = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmitAttempt();
      router.push(`/assessments/${assessment._id}/results/${attempt._id}`);
    } catch {
      router.push(`/assessments/${assessment._id}/results/${attempt._id}`);
    }
  }, [assessment._id, attempt._id, isSubmitting, onSubmitAttempt, router]);

  const totalQuestions = questions.length;
  const answeredCount = Object.values(answers).filter(
    (ans) => ans && ans.length > 0
  ).length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

  if (!currentQuestion) {
    return (
      <div className="p-12 text-center text-slate-400">
        No questions available for this assessment.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Header Bar: Title, Timer, Auto-save status */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
              {assessment.type}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Passing: {assessment.passingScore}%
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
            {assessment.title}
          </h1>
        </div>

        {/* Timer & Status Badges */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Save Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            {saveStatus === 'saving' && (
              <span className="text-slate-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Save failed — retrying
              </span>
            )}
          </div>

          {/* Server-Synchronized Timer */}
          <Timer expiresAt={expiresAt} onExpire={handleTimerExpire} />

          {/* Mobile Navigator Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            title="Question Navigator"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Player Body: Left Question List (28%) + Right Question Viewport (72%) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Desktop Question Navigator Sidebar (hidden on mobile) */}
        <div className="hidden md:block md:col-span-4 lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Question Navigator
              </h3>
              <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                {answeredCount}/{totalQuestions} Answered
              </span>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = (answers[q._id] || []).length > 0;
                const isFlagged = flaggedIds.has(q._id);

                return (
                  <button
                    key={q._id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative h-10 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                      isCurrent
                        ? 'ring-2 ring-brand-600 dark:ring-brand-400 bg-brand-600 text-white shadow-sm'
                        : isAnswered
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                        : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white dark:border-slate-900" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-brand-600" />
                <span>Current Question</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span>Flagged for Review</span>
              </div>
            </div>

            {/* Submit Assessment Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Assessment
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Question Content & Options */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            {/* Question Header: Number, Marks, Flag */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {currentQuestion.marks} {currentQuestion.marks === 1 ? 'Mark' : 'Marks'}
                </span>
              </div>

              {/* Flag for Review Button */}
              <button
                type="button"
                onClick={toggleFlagCurrent}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  flaggedIds.has(currentQuestion._id)
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>
                  {flaggedIds.has(currentQuestion._id) ? 'Flagged' : 'Flag for Review'}
                </span>
              </button>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentQuestion.question}
              </h2>
              {currentQuestion.type === 'MULTIPLE_CHOICE' && (
                <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                  (Select all options that apply)
                </p>
              )}
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {(currentQuestion.options || []).map((opt) => {
                const isSelected = currentSelectedAnswers.includes(opt.id);

                return (
                  <label
                    key={opt.id}
                    onClick={() => {
                      if (currentQuestion.type === 'MULTIPLE_CHOICE') {
                        handleToggleMultipleChoice(opt.id);
                      } else {
                        handleSelectSingleChoice(opt.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-500 dark:border-brand-600 text-brand-950 dark:text-brand-200 shadow-sm'
                        : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100/70 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Selection Box / Radio */}
                      <div
                        className={`w-5 h-5 rounded-${
                          currentQuestion.type === 'MULTIPLE_CHOICE' ? 'md' : 'full'
                        } border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <span className="text-sm font-medium leading-normal">
                        {opt.text}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-bold uppercase text-slate-400 ml-3">
                      {opt.id}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Navigation Buttons: Previous / Next */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Question
              </button>

              {currentIndex < totalQuestions - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold shadow-sm transition"
                >
                  Next Question
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm transition"
                >
                  <Send className="w-4 h-4" />
                  Review & Submit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mobile Slide-Over Question Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          <div
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-xs bg-white dark:bg-slate-900 h-full p-6 shadow-2xl flex flex-col justify-between z-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Questions ({answeredCount}/{totalQuestions})
                </h3>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 overflow-y-auto max-h-[60vh]">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isAnswered = (answers[q._id] || []).length > 0;

                  return (
                    <button
                      key={q._id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setIsMobileDrawerOpen(false);
                      }}
                      className={`h-11 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                        isCurrent
                          ? 'bg-brand-600 text-white'
                          : isAnswered
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                setIsMobileDrawerOpen(false);
                setIsSubmitModalOpen(true);
              }}
              className="w-full py-3 rounded-xl bg-brand-600 text-white text-xs font-bold"
            >
              Submit Assessment
            </button>
          </div>
        </div>
      )}

      {/* 4. Confirmation Submit Dialog Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !isSubmitting && setIsSubmitModalOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-6 z-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
              <Send className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Submit Assessment?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                You have answered <strong>{answeredCount}</strong> of <strong>{totalQuestions}</strong> questions.
              </p>
              {unansweredCount > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium text-left flex items-start gap-2 mt-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    You have {unansweredCount} unanswered {unansweredCount === 1 ? 'question' : 'questions'}. Are you sure you want to submit now?
                  </span>
                </div>
              )}
            </div>

            {submitError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {submitError}
              </p>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition"
              >
                Back to Questions
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Evaluating...
                  </>
                ) : (
                  'Confirm & Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
