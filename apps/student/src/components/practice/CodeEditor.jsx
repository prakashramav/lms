'use client';

import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { RotateCcw, Copy, Check, Settings, Sparkles } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function CodeEditor({
  code,
  onChange,
  language = 'javascript',
  onLanguageChange,
  supportedLanguages = ['javascript'],
  onReset,
  saveStatus = 'saved', // 'saved' | 'saving' | 'error'
  readOnly = false,
  height = '100%',
}) {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [showSettings, setShowSettings] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Map our language IDs to Monaco language identifiers
  const getMonacoLang = (lang) => {
    switch (lang?.toLowerCase()) {
      case 'html_css':
        return 'html';
      case 'react':
        return 'javascript';
      case 'node':
      case 'express':
      case 'javascript':
        return 'javascript';
      case 'python':
        return 'python';
      case 'typescript':
        return 'typescript';
      case 'cpp':
        return 'cpp';
      case 'java':
        return 'java';
      default:
        return 'javascript';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditorMount = (editor, monaco) => {
    // Custom editor configuration
    editor.updateOptions({
      tabSize: 2,
      wordWrap: 'on',
      formatOnPaste: true,
      formatOnType: true,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      lineNumbersMinChars: 3,
      fontFamily: "'Fira Code', 'Courier New', monospace",
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Editor Header / Action Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 text-xs text-slate-300">
        {/* Left: Language selector & Save status */}
        <div className="flex items-center gap-3">
          {supportedLanguages.length > 1 && !readOnly ? (
            <select
              value={language}
              onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang === 'html_css' ? 'HTML / CSS' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
          ) : (
            <span className="font-mono text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              {language === 'html_css' ? 'HTML / CSS' : language.toUpperCase()}
            </span>
          )}

          {/* Autosave badge */}
          {!readOnly && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              {saveStatus === 'saving' && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Saved</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span className="text-rose-400">Save failed</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-2">
          {/* Font Size Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              title="Editor Settings"
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {showSettings && (
              <div className="absolute right-0 top-full mt-1.5 w-40 bg-slate-800 border border-slate-700 rounded-lg p-2.5 shadow-xl z-20 text-slate-200">
                <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Font Size
                </div>
                <div className="flex items-center gap-1">
                  {[12, 14, 16, 18].map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setFontSize(size);
                        setShowSettings(false);
                      }}
                      className={`px-2 py-1 text-xs rounded ${
                        fontSize === size
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            title="Copy Code"
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>

          {/* Reset Button */}
          {!readOnly && onReset && (
            <button
              onClick={() => setShowResetModal(true)}
              title="Reset to Starter Code"
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[11px]">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 min-h-[350px] relative">
        <Editor
          height={height}
          language={getMonacoLang(language)}
          value={code}
          onChange={(val) => onChange && onChange(val || '')}
          theme={theme === 'dark' ? 'vs-dark' : 'vs-dark'} // Clean dark coding contrast
          onMount={handleEditorMount}
          options={{
            fontSize,
            readOnly,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full text-slate-200 shadow-2xl">
            <h4 className="text-base font-semibold text-white mb-2">Reset Code?</h4>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Are you sure you want to reset your code to the initial starter template? Your current changes will be overwritten.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-3.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onReset();
                  setShowResetModal(false);
                }}
                className="px-3.5 py-1.5 text-xs rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors"
              >
                Reset Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
