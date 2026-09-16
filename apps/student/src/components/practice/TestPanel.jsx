'use client';

import React, { useState } from 'react';
import { Play, Send, CheckCircle2, XCircle, Clock, AlertTriangle, Terminal, Layers, History, Code2 } from 'lucide-react';

export default function TestPanel({
  testCases = [],
  customInput = '',
  onCustomInputChange,
  isRunning = false,
  isSubmitting = false,
  onRun,
  onSubmit,
  runResult = null,
  submissionResult = null,
  submissions = [],
  onSelectSubmission,
}) {
  const [activeTab, setActiveTab] = useState('testcases'); // 'testcases' | 'output' | 'console' | 'submissions'
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);
  const [useCustomInput, setUseCustomInput] = useState(false);

  // Switch to output tab when new run or submission completes
  const activeResult = submissionResult || runResult;

  const getVerdictBadge = (verdict) => {
    switch (verdict) {
      case 'ACCEPTED':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
            <span>Accepted</span>
          </div>
        );
      case 'WRONG_ANSWER':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <XCircle className="w-4 h-4" />
            <span>Wrong Answer</span>
          </div>
        );
      case 'TIME_LIMIT_EXCEEDED':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Clock className="w-4 h-4" />
            <span>Time Limit Exceeded</span>
          </div>
        );
      case 'COMPILE_ERROR':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30">
            <AlertTriangle className="w-4 h-4" />
            <span>Compilation Error</span>
          </div>
        );
      case 'RUNTIME_ERROR':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
            <AlertTriangle className="w-4 h-4" />
            <span>Runtime Error</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <span>{verdict || 'Executed'}</span>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Top Header / Tab Strip */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('testcases')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'testcases'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Test Cases
          </button>

          <button
            onClick={() => setActiveTab('output')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'output'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Output
            {activeResult && (
              <span
                className={`w-2 h-2 rounded-full ${
                  activeResult.verdict === 'ACCEPTED' ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'console'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Console
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'submissions'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Submissions
          </button>
        </div>

        {/* Action Buttons: Run & Submit */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('output');
              onRun();
            }}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <span className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
                <span>Run</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('output');
              onSubmit();
            }}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 p-4 overflow-y-auto text-xs text-slate-300">
        {/* TAB 1: TEST CASES */}
        {activeTab === 'testcases' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {testCases.map((tc, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setUseCustomInput(false);
                      setActiveTestCaseIndex(idx);
                    }}
                    className={`px-3 py-1 rounded-md font-medium text-xs transition-colors ${
                      !useCustomInput && activeTestCaseIndex === idx
                        ? 'bg-slate-800 text-blue-400 border border-slate-700'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Case {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => setUseCustomInput(true)}
                  className={`px-3 py-1 rounded-md font-medium text-xs transition-colors ${
                    useCustomInput
                      ? 'bg-slate-800 text-blue-400 border border-slate-700'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Custom Input
                </button>
              </div>
            </div>

            {useCustomInput ? (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Custom Input
                </label>
                <textarea
                  value={customInput}
                  onChange={(e) => onCustomInputChange && onCustomInputChange(e.target.value)}
                  rows={4}
                  placeholder="Enter custom input arguments..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                />
              </div>
            ) : testCases[activeTestCaseIndex] ? (
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Input:
                  </div>
                  <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap">
                    {testCases[activeTestCaseIndex].input}
                  </pre>
                </div>
                {testCases[activeTestCaseIndex].expectedOutput && (
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Expected Output:
                    </div>
                    <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap">
                      {testCases[activeTestCaseIndex].expectedOutput}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500 italic">No public test cases configured.</div>
            )}
          </div>
        )}

        {/* TAB 2: OUTPUT */}
        {activeTab === 'output' && (
          <div>
            {isRunning || isSubmitting ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                <span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Executing test suite in isolated sandbox...</span>
              </div>
            ) : activeResult ? (
              <div className="space-y-4">
                {/* Header Summary */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    {getVerdictBadge(activeResult.verdict)}
                    <span className="text-slate-400 text-xs">
                      Passed {activeResult.passedTests} / {activeResult.totalTests} tests
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {activeResult.executionTime} ms
                    </span>
                    {activeResult.memoryUsed > 0 && (
                      <span>{Math.round(activeResult.memoryUsed / 1024)} MB</span>
                    )}
                  </div>
                </div>

                {/* Test results cards */}
                {activeResult.testResults && activeResult.testResults.length > 0 && (
                  <div className="space-y-2.5">
                    {activeResult.testResults.map((tr, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg border p-3 ${
                          tr.passed
                            ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                            : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold text-xs mb-1.5">
                          <span className="flex items-center gap-1.5">
                            {tr.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400" />
                            )}
                            Test Case {tr.order || idx + 1} {tr.isHidden ? '(Hidden)' : ''}
                          </span>
                          {tr.executionTime !== undefined && (
                            <span className="text-[11px] font-normal text-slate-400">
                              {tr.executionTime} ms
                            </span>
                          )}
                        </div>

                        {!tr.isHidden && tr.input && (
                          <div className="text-[11px] text-slate-400 mb-1">
                            <span className="font-semibold text-slate-300">Input: </span>
                            <span className="font-mono text-slate-200">{tr.input}</span>
                          </div>
                        )}

                        <div className="text-[11px] text-slate-400 mb-1">
                          <span className="font-semibold text-slate-300">Output: </span>
                          <span className="font-mono text-slate-200">{tr.actualOutput || '(none)'}</span>
                        </div>

                        {!tr.isHidden && tr.expectedOutput && !tr.passed && (
                          <div className="text-[11px] text-slate-400">
                            <span className="font-semibold text-slate-300">Expected: </span>
                            <span className="font-mono text-emerald-400">{tr.expectedOutput}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                Click <strong className="text-slate-300">Run</strong> to test your code or{' '}
                <strong className="text-emerald-400">Submit</strong> to evaluate all test cases.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CONSOLE */}
        {activeTab === 'console' && (
          <div>
            <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Standard Output (stdout)
            </div>
            {activeResult?.stdout ? (
              <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-emerald-400 whitespace-pre-wrap overflow-x-auto max-h-60">
                {activeResult.stdout}
              </pre>
            ) : (
              <div className="text-slate-500 italic py-6">No console output recorded.</div>
            )}

            {activeResult?.stderr && (
              <div className="mt-4">
                <div className="text-[11px] font-semibold text-rose-400 mb-2 uppercase tracking-wider">
                  Standard Error (stderr)
                </div>
                <pre className="bg-slate-950 border border-rose-900/40 rounded-lg p-3 font-mono text-xs text-rose-300 whitespace-pre-wrap overflow-x-auto max-h-60">
                  {activeResult.stderr}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SUBMISSIONS */}
        {activeTab === 'submissions' && (
          <div>
            {submissions && submissions.length > 0 ? (
              <div className="space-y-2">
                {submissions.map((sub) => (
                  <div
                    key={sub._id}
                    onClick={() => onSelectSubmission && onSelectSubmission(sub)}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {sub.verdict === 'ACCEPTED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <span className="font-medium text-slate-200">{sub.verdict}</span>
                      <span className="text-slate-500 text-[11px]">({sub.language})</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500">No submissions yet for this problem.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
